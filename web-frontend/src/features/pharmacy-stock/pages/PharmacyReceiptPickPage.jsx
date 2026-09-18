import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { BaseButton } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import PharmacyListToolbar from '../components/PharmacyListToolbar';
import PharmacyProductModal from '../components/PharmacyProductModal';
import PharmacyProductDeleteModal from '../components/PharmacyProductDeleteModal';
import PharmacyBulkNumberModal from '../components/PharmacyBulkNumberModal';
import PharmacyReceiptImportWizard from '../components/PharmacyReceiptImportWizard';
import PharmacyReceiptLineBulkBar from '../components/PharmacyReceiptLineBulkBar';
import PharmacyReceiptMassEditBar from '../components/PharmacyReceiptMassEditBar';
import PharmacyReceiptLineModal from '../components/PharmacyReceiptLineModal';
import PharmacyStockLayout from '../components/PharmacyStockLayout';
import {
  PharmacyEditCell,
  PharmacySelectAllTh,
  PharmacySelectCell,
  PharmacySelectionBar,
} from '../components/PharmacyTableSelect';
import { usePharmacyRowSelection } from '../hooks/usePharmacyRowSelection';
import { usePharmacyProductDelete } from '../hooks/usePharmacyProductDelete';
import { usePharmacyReceiptImport } from '../hooks/usePharmacyReceiptImport';
import { usePharmacyReceiptRevalue } from '../hooks/usePharmacyReceiptRevalue';
import { usePharmacyReceiptMassEdit } from '../hooks/usePharmacyReceiptMassEdit';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import {
  formatMoney,
  productCountry,
  productDosageForm,
  productManufacturer,
  productUnitsInPack,
} from '../utils/pharmacyReceiptPricing';
import {
  PHARM_DEFAULT_PAGE_SIZE,
  PHARM_PAGE_SIZES,
  useClientTablePage,
} from '../utils/pharmacyTablePage';
import { productStubFromReceiptLine } from '../utils/productStubFromReceiptLine';

export default function PharmacyReceiptPickPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogPageSize, setCatalogPageSize] = useState(PHARM_DEFAULT_PAGE_SIZE);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingLine, setEditingLine] = useState(null);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [aboutProduct, setAboutProduct] = useState(null);

  const receiptQuery = useQuery({
    queryKey: ['pharmacy-receipt', id],
    queryFn: () => pharmacyWarehouseApi.getReceipt(id).then((r) => r.data),
    enabled: Boolean(id),
  });

  const productsQuery = useQuery({
    queryKey: ['pharmacy-warehouse-products', search, catalogPage, catalogPageSize],
    queryFn: () => pharmacyWarehouseApi.listProducts({
      search: search.trim() || undefined,
      page: catalogPage,
      size: catalogPageSize,
      activeOnly: true,
    }).then((r) => r.data),
  });

  const addQueueRef = useRef([]);

  const addLineMutation = useMutation({
    mutationFn: (line) => pharmacyWarehouseApi.addLine(id, line),
    onSuccess: (res) => {
      toast.success(t('pharmacyStock.lineAdded'));
      qc.setQueryData(['pharmacy-receipt', id], res.data);
      const next = addQueueRef.current.shift();
      setSelectedProduct(next || null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, payload }) => {
      await pharmacyWarehouseApi.updateLine(id, lineId, payload);
      const fresh = await pharmacyWarehouseApi.getReceipt(id, { timeout: 180000 });
      return fresh.data;
    },
    onSuccess: (data) => {
      toast.success(t('pharmacyStock.saved'));
      qc.setQueryData(['pharmacy-receipt', id], data);
      setEditingLine(null);
      setSelectedProduct(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const receipt = receiptQuery.data;
  const catalog = productsQuery.data?.content ?? [];
  const catalogTotal = productsQuery.data?.totalElements ?? catalog.length;
  const catalogPages = productsQuery.data?.totalPages ?? 1;
  const docLines = receipt?.lines ?? [];
  const defaultMarkup = receipt?.defaultMarkupPercent ?? 20;
  const isDraft = receipt?.status === 'DRAFT';
  const linesPage = useClientTablePage(docLines, id);
  const catalogSelect = usePharmacyRowSelection(catalog, `${id}:${search}`);
  const productDelete = usePharmacyProductDelete(t, { onDone: () => catalogSelect.clearSelection() });
  const linesSelect = usePharmacyRowSelection(linesPage.rows, id);
  const importer = usePharmacyReceiptImport({
    receiptId: id,
    t,
    onImported: (data, meta) => {
      qc.setQueryData(['pharmacy-receipt', id], data);
      if (meta?.goToDocument) {
        navigate(PHARMACY_STOCK_PATHS.receipt(id), {
          state: { importMarksHint: Boolean(meta.hasImportMarks) },
        });
      }
    },
  });
  const revalue = usePharmacyReceiptRevalue({
    receiptId: id,
    lines: docLines,
    selection: linesSelect,
    t,
    onUpdated: (data) => qc.setQueryData(['pharmacy-receipt', id], data),
  });
  const mass = usePharmacyReceiptMassEdit({
    receiptId: id,
    lines: docLines,
    selection: linesSelect,
    t,
    onUpdated: (data) => qc.setQueryData(['pharmacy-receipt', id], data),
  });

  const removeSelectedLines = useMutation({
    mutationFn: async (lineIds) => {
      let last = receiptQuery.data;
      for (const lineId of lineIds) {
        const res = await pharmacyWarehouseApi.removeLine(id, lineId);
        last = res.data;
      }
      return last;
    },
    onSuccess: (data) => {
      qc.setQueryData(['pharmacy-receipt', id], data);
      linesSelect.clearSelection();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  useEffect(() => {
    if (receipt && !isDraft) {
      navigate(PHARMACY_STOCK_PATHS.receipt(id), { replace: true });
    }
  }, [receipt, isDraft, id, navigate]);

  if (receiptQuery.isLoading || !receipt || !isDraft) {
    return (
      <PharmacyStockLayout title={t('pharmacyStock.pickTitle')}>
        <div className="pharmacy-stock__empty">{t('common.loading')}</div>
      </PharmacyStockLayout>
    );
  }

  return (
    <PharmacyStockLayout
      className="min-h-[70vh]"
      backTo={PHARMACY_STOCK_PATHS.receipt(id)}
      backLabel={t('pharmacyStock.backToDocument')}
      backIconOnly
      title={`${t('pharmacyStock.documentTitle')} | ${t('pharmacyStock.pickProducts')}`}
      actions={(
        <BaseButton onClick={() => navigate(PHARMACY_STOCK_PATHS.receipt(id))}>
          {t('pharmacyStock.finishPick')}
        </BaseButton>
      )}
    >
      <PharmacyListToolbar
        t={t}
        createLabel={t('pharmacyStock.createProduct')}
        onCreate={() => setCreateProductOpen(true)}
        onImport={importer.openFile}
        onRefresh={() => productsQuery.refetch()}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setCatalogPage(0);
        }}
        searchPlaceholder={t('pharmacyStock.searchPlaceholder')}
      />
      <input
        ref={importer.fileRef}
        type="file"
        accept=".xlsx,.xls,.pdf,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={importer.onFile}
      />

      <div className="pharmacy-stock__split">
        <div className="pharmacy-stock__panel flex min-h-0 flex-col">
          <div className="pharmacy-stock__panel-head">
            <span>{t('pharmacyStock.colName')}</span>
            <PharmacySelectionBar t={t} selection={catalogSelect}>
              <BaseButton
                size="sm"
                disabled={!catalogSelect.selectedCount}
                onClick={() => {
                  const products = catalogSelect.selectedRows;
                  if (!products.length) return;
                  addQueueRef.current = products.slice(1);
                  catalogSelect.clearSelection();
                  setSelectedProduct(products[0]);
                }}
              >
                {t('pharmacyStock.addSelected')}
              </BaseButton>
              <button
                type="button"
                className="pharmacy-stock__row-btn pharmacy-stock__row-btn--danger"
                disabled={productDelete.deleting}
                onClick={() => productDelete.ask(catalogSelect.selectedRows)}
              >
                {t('pharmacyStock.deleteSelected')}
              </button>
            </PharmacySelectionBar>
            <span>{catalogTotal}</span>
          </div>
          <div className="pharmacy-stock__table-wrap min-h-0 flex-1">
            <table className="pharmacy-stock__table">
              <thead>
                <tr>
                  <PharmacySelectAllTh t={t} selection={catalogSelect} disabled={catalog.length === 0} />
                  <th>№</th>
                  <th>{t('pharmacyStock.colName')}</th>
                  <th>{t('pharmacyStock.colManufacturer')}</th>
                  <th>{t('pharmacyStock.colCountry')}</th>
                  <th>{t('pharmacyStock.colForm')}</th>
                  <th>{t('pharmacyStock.unitsInPack')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {catalog.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="pharmacy-stock__empty">
                        {productsQuery.isLoading
                          ? t('common.loading')
                          : t('pharmacyStock.catalogEmpty')}
                      </div>
                    </td>
                  </tr>
                ) : catalog.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={catalogSelect.isSelected(p.id) ? 'pharmacy-stock__row--selected' : undefined}
                  >
                    <PharmacySelectCell t={t} row={p} selection={catalogSelect} />
                    <td>{catalogPage * catalogPageSize + idx + 1}</td>
                    <td className="font-semibold">{p.name}</td>
                    <td>{productManufacturer(p) || '—'}</td>
                    <td>{productCountry(p) || '—'}</td>
                    <td>{productDosageForm(p) || '—'}</td>
                    <td>{productUnitsInPack(p) || 1}</td>
                    <PharmacyEditCell
                      t={t}
                      onEdit={() => setAboutProduct(p)}
                      onDelete={() => productDelete.ask(p)}
                    >
                      <button
                        type="button"
                        className="pharmacy-stock__row-btn"
                        onClick={() => setSelectedProduct(p)}
                      >
                        {t('pharmacyStock.select')}
                      </button>
                    </PharmacyEditCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={catalogPage}
            pageSize={catalogPageSize}
            total={catalogTotal}
            totalPages={catalogPages}
            onPageChange={setCatalogPage}
            onPageSizeChange={setCatalogPageSize}
            pageSizeOptions={PHARM_PAGE_SIZES}
          />
        </div>

        <div className="pharmacy-stock__panel flex min-h-0 flex-col">
          <div className="pharmacy-stock__panel-head">
            <span>{t('pharmacyStock.inDocument')}</span>
            <PharmacyReceiptLineBulkBar
              t={t}
              selection={linesSelect}
              canRevalue={revalue.canOpen}
              onVat={revalue.openVat}
              onMarkup={revalue.openMarkup}
              deleting={removeSelectedLines.isPending}
              onDelete={() => {
                const ids = linesSelect.selectedRows.map((row) => row.id);
                if (!ids.length) return;
                if (!window.confirm(t('pharmacyStock.deleteSelectedConfirm', { count: ids.length }))) return;
                removeSelectedLines.mutate(ids);
              }}
            />
            <span>{docLines.length}</span>
          </div>
          {isDraft ? <PharmacyReceiptMassEditBar t={t} mass={mass} /> : null}
          <div className="pharmacy-stock__table-wrap min-h-0 flex-1">
            <table className="pharmacy-stock__table">
              <thead>
                <tr>
                  <PharmacySelectAllTh t={t} selection={linesSelect} disabled={docLines.length === 0} />
                  <th>№</th>
                  <th>{t('pharmacyStock.colName')}</th>
                  <th>{t('pharmacyStock.colManufacturer')}</th>
                  <th>{t('pharmacyStock.colCountry')}</th>
                  <th>{t('pharmacyStock.colQty')}</th>
                  <th>{t('pharmacyStock.purchasePrice')}</th>
                  <th>{t('pharmacyStock.vatRate')}</th>
                  <th>{t('pharmacyStock.markupPercent')}</th>
                  <th>{t('pharmacyStock.colPurchaseSum')}</th>
                  <th>{t('pharmacyStock.colRetailSum')}</th>
                  <th>{t('pharmacyStock.batch')}</th>
                  <th>{t('pharmacyStock.expiry')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {docLines.length === 0 ? (
                  <tr>
                    <td colSpan={14}>
                      <div className="pharmacy-stock__empty">{t('pharmacyStock.noLines')}</div>
                    </td>
                  </tr>
                ) : linesPage.rows.map((line, idx) => {
                  const qty = Number(line.quantity) || 0;
                  const purchase = Number(line.purchasePriceWithVat ?? line.purchasePrice) || 0;
                  const retail = Number(line.retailPrice ?? line.unitSellingPrice) || 0;
                  return (
                    <tr
                      key={line.id}
                      className={linesSelect.isSelected(line.id) ? 'pharmacy-stock__row--selected' : undefined}
                    >
                      <PharmacySelectCell t={t} row={line} selection={linesSelect} />
                      <td>{linesPage.startIndex + idx + 1}</td>
                      <td>{line.productName}</td>
                      <td>{line.manufacturer || '—'}</td>
                      <td>{line.country || '—'}</td>
                      <td>{line.quantity}</td>
                      <td>{formatMoney(line.purchasePrice)}</td>
                      <td>{line.vatPercent ?? '—'}</td>
                      <td>{line.markupPercent ?? '—'}</td>
                      <td>{formatMoney(purchase * qty)}</td>
                      <td>{formatMoney(retail * qty)}</td>
                      <td>{line.batchNumber || '—'}</td>
                      <td>{line.expiryDate || '—'}</td>
                      <PharmacyEditCell t={t} onEdit={() => setEditingLine(line)} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={linesPage.page}
            pageSize={linesPage.pageSize}
            total={linesPage.total}
            totalPages={linesPage.totalPages}
            onPageChange={linesPage.setPage}
            onPageSizeChange={linesPage.setPageSize}
            pageSizeOptions={PHARM_PAGE_SIZES}
          />
        </div>
      </div>

      <PharmacyReceiptLineModal
        open={Boolean(selectedProduct) || Boolean(editingLine)}
        onClose={() => {
          addQueueRef.current = [];
          setSelectedProduct(null);
          setEditingLine(null);
          setAboutProduct(null);
        }}
        t={t}
        product={selectedProduct}
        existingLine={editingLine}
        defaultMarkup={defaultMarkup}
        saving={addLineMutation.isPending || updateLineMutation.isPending}
        onAboutProduct={() => {
          if (selectedProduct) {
            setAboutProduct(selectedProduct);
            return;
          }
          setAboutProduct(productStubFromReceiptLine(editingLine));
        }}
        onSave={(payload, lineId) => {
          if (lineId) {
            updateLineMutation.mutate({ lineId, payload });
          } else {
            addLineMutation.mutate(payload);
          }
        }}
      />

      <PharmacyProductModal
        open={createProductOpen || Boolean(aboutProduct)}
        product={aboutProduct}
        overlayClassName={aboutProduct ? '!z-[60]' : undefined}
        withReceiptLine={createProductOpen && !aboutProduct}
        defaultMarkup={defaultMarkup}
        onClose={() => {
          setCreateProductOpen(false);
          setAboutProduct(null);
        }}
        storeId={receipt.storeId}
        onDelete={aboutProduct?.active !== false ? () => {
          const current = aboutProduct;
          setAboutProduct(null);
          productDelete.ask(current);
        } : undefined}
        onSaved={(created, linePayload) => {
          productsQuery.refetch();
          setAboutProduct(null);
          setCreateProductOpen(false);
          if (linePayload && created?.id) {
            addLineMutation.mutate({ ...linePayload, productId: created.id });
            return;
          }
          if (created?.id && !editingLine) setSelectedProduct(created);
        }}
      />
      <PharmacyProductDeleteModal
        open={productDelete.pending.length > 0}
        onClose={productDelete.close}
        t={t}
        saving={productDelete.deleting}
        products={productDelete.pending}
        onConfirm={productDelete.confirm}
      />

      <PharmacyReceiptImportWizard t={t} imp={importer} />
      <PharmacyBulkNumberModal
        open={revalue.mode === 'vat'}
        onClose={revalue.close}
        t={t}
        title={t('pharmacyStock.bulkVatTitle')}
        hint={t('pharmacyStock.bulkVatHint', { count: revalue.targetCount })}
        fieldLabel={t('pharmacyStock.bulkVatField')}
        max={100}
        saving={revalue.saving}
        onSubmit={revalue.submit}
      />
      <PharmacyBulkNumberModal
        open={revalue.mode === 'markup'}
        onClose={revalue.close}
        t={t}
        title={t('pharmacyStock.bulkRevalueTitle')}
        hint={t('pharmacyStock.bulkRevalueHint', { count: revalue.targetCount })}
        fieldLabel={t('pharmacyStock.bulkRevalueField')}
        max={1000}
        saving={revalue.saving}
        onSubmit={revalue.submit}
      />
    </PharmacyStockLayout>
  );
}
