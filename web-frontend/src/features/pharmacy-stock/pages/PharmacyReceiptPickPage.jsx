import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { BaseButton } from '../../../components/ui';
import PharmacyListToolbar from '../components/PharmacyListToolbar';
import PharmacyProductModal from '../components/PharmacyProductModal';
import PharmacyProductDeleteModal from '../components/PharmacyProductDeleteModal';
import PharmacyBulkNumberModal from '../components/PharmacyBulkNumberModal';
import PharmacyReceiptImportWizard from '../components/PharmacyReceiptImportWizard';
import PharmacyReceiptLineModal from '../components/PharmacyReceiptLineModal';
import PharmacyReceiptPickCatalogPanel from '../components/PharmacyReceiptPickCatalogPanel';
import PharmacyReceiptPickLinesPanel from '../components/PharmacyReceiptPickLinesPanel';
import PharmacyStockLayout from '../components/PharmacyStockLayout';
import { usePharmacyRowSelection } from '../hooks/usePharmacyRowSelection';
import { usePharmacyProductDelete } from '../hooks/usePharmacyProductDelete';
import { usePharmacyReceiptImport } from '../hooks/usePharmacyReceiptImport';
import { usePharmacyReceiptRevalue } from '../hooks/usePharmacyReceiptRevalue';
import { usePharmacyReceiptMassEdit } from '../hooks/usePharmacyReceiptMassEdit';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import {
  PHARM_DEFAULT_PAGE_SIZE,
  useClientTablePage,
} from '../utils/pharmacyTablePage';
import { productStubFromReceiptLine } from '../utils/productStubFromReceiptLine';
import '../styles/pharmacy-receipt-pick.css';

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
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
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
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
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
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  useEffect(() => {
    if (receipt && !isDraft) {
      navigate(PHARMACY_STOCK_PATHS.receipt(id), { replace: true });
    }
  }, [receipt, isDraft, id, navigate]);

  if (receiptQuery.isLoading || !receipt || !isDraft) {
    return (
      <PharmacyStockLayout title={t('pharmacyStock.pickFromCatalog')}>
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
      title={t('pharmacyStock.pickFromCatalog')}
      subtitle={receipt.receiptNumber}
      actions={(
        <BaseButton onClick={() => navigate(PHARMACY_STOCK_PATHS.receipt(id))}>
          {t('pharmacyStock.finishPick')}
        </BaseButton>
      )}
    >
      <div className="pharmacy-receipt-pick-page">
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

        <div className="pharmacy-receipt-pick">
          <PharmacyReceiptPickCatalogPanel
            t={t}
            catalog={catalog}
            catalogTotal={catalogTotal}
            catalogPage={catalogPage}
            catalogPageSize={catalogPageSize}
            catalogPages={catalogPages}
            loading={productsQuery.isLoading}
            catalogSelect={catalogSelect}
            productDelete={productDelete}
            onPageChange={setCatalogPage}
            onPageSizeChange={setCatalogPageSize}
            onAddSelected={() => {
              const products = catalogSelect.selectedRows;
              if (!products.length) return;
              addQueueRef.current = products.slice(1);
              catalogSelect.clearSelection();
              setSelectedProduct(products[0]);
            }}
            onAbout={setAboutProduct}
            onSelect={setSelectedProduct}
          />
          <PharmacyReceiptPickLinesPanel
            t={t}
            docLines={docLines}
            linesPage={linesPage}
            linesSelect={linesSelect}
            revalue={revalue}
            mass={mass}
            isDraft={isDraft}
            deleting={removeSelectedLines.isPending}
            onDeleteSelected={() => {
              const ids = linesSelect.selectedRows.map((row) => row.id);
              if (!ids.length) return;
              if (!window.confirm(t('pharmacyStock.deleteSelectedConfirm', { count: ids.length }))) return;
              removeSelectedLines.mutate(ids);
            }}
            onEditLine={setEditingLine}
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
