import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi, supplierApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { BaseButton } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import PharmacyProductModal from '../components/PharmacyProductModal';
import PharmacyProductDeleteModal from '../components/PharmacyProductDeleteModal';
import PharmacyBulkNumberModal from '../components/PharmacyBulkNumberModal';
import PharmacyReceiptActivateModal from '../components/PharmacyReceiptActivateModal';
import PharmacyReceiptDeleteModal from '../components/PharmacyReceiptDeleteModal';
import PharmacyReceiptHeaderModal from '../components/PharmacyReceiptHeaderModal';
import PharmacyReceiptLineBulkBar from '../components/PharmacyReceiptLineBulkBar';
import PharmacyReceiptMassEditBar from '../components/PharmacyReceiptMassEditBar';
import PharmacyReceiptLineModal from '../components/PharmacyReceiptLineModal';
import PharmacyReceiptMarksPanel from '../components/PharmacyReceiptMarksPanel';
import PharmacyStockLayout, { PharmacyStatusBadge } from '../components/PharmacyStockLayout';
import {
  PharmacyEditCell,
  PharmacySelectAllTh,
  PharmacySelectCell,
} from '../components/PharmacyTableSelect';
import { usePharmacyRowSelection } from '../hooks/usePharmacyRowSelection';
import { usePharmacyProductDelete } from '../hooks/usePharmacyProductDelete';
import { usePharmacyReceiptRevalue } from '../hooks/usePharmacyReceiptRevalue';
import { usePharmacyReceiptMassEdit } from '../hooks/usePharmacyReceiptMassEdit';
import { usePharmacyReceiptMarks } from '../hooks/usePharmacyReceiptMarks';
import { usePharmacyImportMarksAsk } from '../hooks/usePharmacyImportMarksAsk';
import { usePharmacyIntegrationConfig } from '../../pharmacy-cashier/hooks/usePharmacyIntegrationConfig';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import {
  formatMoney,
  linesReadyForActivate,
} from '../utils/pharmacyReceiptPricing';
import {
  flattenReceiptMarks,
  receiptMarksReady,
} from '../utils/pharmacyReceiptMarks';
import { PHARM_PAGE_SIZES, useClientTablePage } from '../utils/pharmacyTablePage';
import { productStubFromReceiptLine } from '../utils/productStubFromReceiptLine';
import PharmacyReceiptImportMarksVerifyModal from '../components/PharmacyReceiptImportMarksVerifyModal';
import '../styles/pharmacy-import-marks-ask.css';

export default function PharmacyReceiptDocumentPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [aboutProduct, setAboutProduct] = useState(null);

  const receiptQuery = useQuery({
    queryKey: ['pharmacy-receipt', id],
    queryFn: () => pharmacyWarehouseApi.getReceipt(id).then((r) => r.data),
    enabled: Boolean(id),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => pharmacyWarehouseApi.updateDraft(id, body),
    onSuccess: (res) => {
      toast.success(t('pharmacyStock.saved'));
      qc.setQueryData(['pharmacy-receipt', id], res.data);
      setEditOpen(false);
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
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const deleteDraftMutation = useMutation({
    mutationFn: () => pharmacyWarehouseApi.deleteDraft(id),
    onSuccess: () => {
      toast.success(t('pharmacyStock.deleteDraftDone'));
      setDeleteOpen(false);
      qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
      navigate(PHARMACY_STOCK_PATHS.receipts);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const removeLineMutation = useMutation({
    mutationFn: (lineId) => pharmacyWarehouseApi.removeLine(id, lineId),
    onSuccess: (res) => {
      qc.setQueryData(['pharmacy-receipt', id], res.data);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.saveFailed')),
  });

  const receiptPreview = receiptQuery.data;
  const integration = usePharmacyIntegrationConfig(receiptPreview?.storeId);
  const aslEnabled = Boolean(integration.capabilities?.aslMarkingEnabled);
  const aslReady = Boolean(receiptPreview?.storeId) && !integration.isLoading;
  const receiptMarks = usePharmacyReceiptMarks({
    storeId: receiptPreview?.storeId,
    t,
    aslEnabled,
  });
  const { hydrateMarks } = receiptMarks;

  const importMarksAsk = usePharmacyImportMarksAsk({
    receiptId: id,
    lines: receiptPreview?.lines,
    storeId: receiptPreview?.storeId,
    aslEnabled,
    aslReady,
    hydrateMarks,
    t,
    showHint: Boolean(location.state?.importMarksHint),
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const marks = flattenReceiptMarks(receiptMarks.marksByLineId, receiptQuery.data?.lines ?? []);
      const posted = await pharmacyWarehouseApi.activate(
        id,
        marks.length ? { marks } : {},
      );
      const fresh = await pharmacyWarehouseApi.getReceipt(id, { timeout: 180000 });
      return { posted: posted.data, receipt: fresh.data };
    },
    onSuccess: ({ posted, receipt: data }) => {
      toast.success(t('pharmacyStock.activated', { no: posted.receiptNumber || data.receiptNumber }));
      invalidateProductCaches(qc);
      qc.setQueryData(['pharmacy-receipt', id], data);
      qc.invalidateQueries({ queryKey: ['pharmacy-receipts'] });
      setActivateOpen(false);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pharmacyStock.activateFailed')),
  });

  const receipt = receiptQuery.data;
  const isDraft = receipt?.status === 'DRAFT';
  const suppliers = suppliersQuery.data?.content ?? [];
  const canActivate = linesReadyForActivate(receipt?.lines);
  const marksGate = receiptMarksReady(receipt?.lines ?? [], receiptMarks.marksByLineId);
  const markedLines = (receipt?.lines ?? []).filter((line) => line.markedProduct);
  const linesPage = useClientTablePage(receipt?.lines ?? [], id);
  const linesSelect = usePharmacyRowSelection(linesPage.rows, id);
  const productDelete = usePharmacyProductDelete(t, {
    onDone: () => receiptQuery.refetch(),
  });
  const revalue = usePharmacyReceiptRevalue({
    receiptId: id,
    lines: receipt?.lines ?? [],
    selection: linesSelect,
    t,
    onUpdated: (data) => qc.setQueryData(['pharmacy-receipt', id], data),
  });
  const mass = usePharmacyReceiptMassEdit({
    receiptId: id,
    lines: receipt?.lines ?? [],
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

  if (receiptQuery.isLoading) {
    return (
      <PharmacyStockLayout title={t('pharmacyStock.documentTitle')}>
        <div className="pharmacy-stock__empty">{t('common.loading')}</div>
      </PharmacyStockLayout>
    );
  }
  if (!receipt) {
    return (
      <PharmacyStockLayout
        backTo={PHARMACY_STOCK_PATHS.receipts}
        backLabel={t('pharmacyStock.backToList')}
        title={t('pharmacyStock.documentTitle')}
      >
        <div className="pharmacy-stock__empty">{t('pharmacyStock.notFound')}</div>
      </PharmacyStockLayout>
    );
  }

  const openActivate = () => {
    if (!canActivate) {
      toast.error(t('pharmacyStock.activateNeedLots'));
      return;
    }
    if (!marksGate.ok) {
      toast.error(t('pharmacyStock.activateNeedMarks'));
      return;
    }
    setActivateOpen(true);
  };

  return (
    <PharmacyStockLayout
      backTo={PHARMACY_STOCK_PATHS.receipts}
      backLabel={t('pharmacyStock.backToList')}
      backIconOnly
      title={`${t('pharmacyStock.documentTitle')} · ${receipt.receiptNumber}`}
      badge={<PharmacyStatusBadge status={receipt.status} t={t} />}
      subtitle={[receipt.storeName, receipt.supplierName].filter(Boolean).join(' · ') || undefined}
      actions={(
        <>
          {isDraft ? (
            <>
              <BaseButton variant="secondary" onClick={() => setEditOpen(true)}>
                {t('pharmacyStock.edit')}
              </BaseButton>
              <BaseButton onClick={openActivate} disabled={!receipt.lines?.length}>
                {t('pharmacyStock.activate')}
              </BaseButton>
            </>
          ) : null}
          <BaseButton
            variant="danger"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteDraftMutation.isPending}
          >
            {t('pharmacyStock.deleteReceipt')}
          </BaseButton>
          <BaseButton variant="secondary" onClick={() => navigate(PHARMACY_STOCK_PATHS.receipts)}>
            {t('common.close')}
          </BaseButton>
        </>
      )}
    >
      {!canActivate && isDraft && receipt.lines?.length ? (
        <p className="pharmacy-stock__alert">{t('pharmacyStock.activateNeedLots')}</p>
      ) : null}

      <div className="pharmacy-stock__meta-grid">
        <aside className="pharmacy-stock__aside">
          <Meta label={t('pharmacyStock.receiptType')} value={t('pharmacyStock.receiptTypeReceipt')} />
          <Meta label={t('pharmacyStock.colStatus')} value={<PharmacyStatusBadge status={receipt.status} t={t} />} />
          <Meta label={t('pharmacyStock.colDocNo')} value={receipt.receiptNumber} />
          <Meta label={t('pharmacyStock.colDate')} value={receipt.documentDate || '—'} />
          <Meta label={t('pharmacyStock.markup')} value={receipt.defaultMarkupPercent ?? '—'} />
          <Meta label={t('stockReports.colStore')} value={receipt.storeName || '—'} />

          <div>
            <p className="pharmacy-stock__section-title">{t('pharmacyStock.invoiceSection')}</p>
            <Meta label={t('stockReports.colSupplier')} value={receipt.supplierName || '—'} />
            <Meta label={t('pharmacyStock.invoiceNumber')} value={receipt.invoiceNumber || '—'} />
            <Meta label={t('pharmacyStock.invoiceDate')} value={receipt.invoiceDate || '—'} />
            <Meta label={t('pharmacyStock.contractNumber')} value={receipt.contractNumber || '—'} />
            <Meta label={t('pharmacyStock.financialDiscount')} value={receipt.financialDiscount ?? '—'} />
          </div>

          <div>
            <p className="pharmacy-stock__section-title">{t('pharmacyStock.colLines')}</p>
            <Meta label={t('pharmacyStock.colLines')} value={receipt.lineCount ?? receipt.lines?.length ?? 0} />
            <Meta label={t('pharmacyStock.colPurchaseSum')} value={formatMoney(receipt.totalCost)} />
            <Meta label={t('pharmacyStock.colRetailSum')} value={formatMoney(receipt.totalRetail)} />
          </div>

          {receipt.createdByName ? (
            <p className="pharmacy-stock__foot-note">
              {receipt.createdByName}
              {receipt.createdAt ? ` · ${new Date(receipt.createdAt).toLocaleString('ru-RU')}` : ''}
            </p>
          ) : null}
        </aside>

        <section className="pharmacy-stock__doc-main">
          {isDraft ? (
            <div className="pharmacy-stock__actions">
              <BaseButton onClick={() => navigate(PHARMACY_STOCK_PATHS.receiptPick(id))}>
                {t('pharmacyStock.pickProducts')}
              </BaseButton>
              <BaseButton variant="secondary" onClick={() => receiptQuery.refetch()}>
                {t('common.refresh')}
              </BaseButton>
            </div>
          ) : null}

          <div className="pharmacy-stock__panel flex min-h-0 flex-col">
            <div className="pharmacy-stock__panel-head">
              <span>{t('pharmacyStock.inDocument')}</span>
              <span>{receipt.lines?.length ?? 0}</span>
            </div>
            {isDraft ? (
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
            ) : null}
            {isDraft ? <PharmacyReceiptMassEditBar t={t} mass={mass} /> : null}
            <div className="pharmacy-stock__table-wrap">
              <table className="pharmacy-stock__table">
                <thead>
                  <tr>
                    <PharmacySelectAllTh t={t} selection={linesSelect} disabled={!isDraft || !(receipt.lines ?? []).length} />
                    <th>№</th>
                    <th>{t('pharmacyStock.colName')}</th>
                    <th>{t('pharmacyStock.colManufacturer')}</th>
                    <th>{t('pharmacyStock.colCountry')}</th>
                    <th>{t('pharmacyStock.colQty')}</th>
                    <th>{t('pharmacyStock.purchasePrice')}</th>
                    <th>{t('pharmacyStock.vatRate')}</th>
                    <th>{t('pharmacyStock.markupPercent')}</th>
                    <th>{t('pharmacyStock.retailPrice')}</th>
                    <th>{t('pharmacyStock.batch')}</th>
                    <th>{t('pharmacyStock.expiry')}</th>
                    <th className="pharmacy-stock__row-actions" />
                  </tr>
                </thead>
                <tbody>
                  {(receipt.lines ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={13}>
                        <div className="pharmacy-stock__empty">{t('pharmacyStock.noLines')}</div>
                      </td>
                    </tr>
                  ) : linesPage.rows.map((line, idx) => (
                    <tr
                      key={line.id}
                      className={`${linesSelect.isSelected(line.id) ? 'pharmacy-stock__row--selected' : ''}${!isDraft ? ' pharmacy-stock__row--clickable' : ''}`}
                      onClick={!isDraft ? () => setAboutProduct(productStubFromReceiptLine(line)) : undefined}
                    >
                      <PharmacySelectCell t={t} row={line} selection={linesSelect} disabled={!isDraft} />
                      <td>{linesPage.startIndex + idx + 1}</td>
                      <td className="font-semibold">{line.productName}</td>
                      <td>{line.manufacturer || '—'}</td>
                      <td>{line.country || '—'}</td>
                      <td>{line.quantity}</td>
                      <td>{formatMoney(line.purchasePrice)}</td>
                      <td>{line.vatPercent ?? '—'}</td>
                      <td>{line.markupPercent ?? '—'}</td>
                      <td>{formatMoney(line.retailPrice ?? line.unitSellingPrice)}</td>
                      <td>{line.batchNumber || '—'}</td>
                      <td>{line.expiryDate || '—'}</td>
                      {isDraft ? (
                        <PharmacyEditCell
                          t={t}
                          onEdit={() => setEditingLine(line)}
                          onDelete={() => {
                            if (!window.confirm(t('pharmacyStock.deleteLineConfirm', { name: line.productName }))) return;
                            removeLineMutation.mutate(line.id);
                          }}
                        />
                      ) : (
                        <PharmacyEditCell
                          t={t}
                          onEdit={() => setAboutProduct(productStubFromReceiptLine(line))}
                        />
                      )}
                    </tr>
                  ))}
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
            {isDraft && markedLines.length > 0 ? (
              <div className="pharmacy-stock__marks-section">
                <h3 className="pharmacy-stock__pane-title">{t('pharmacyStock.marks.sectionTitle')}</h3>
                {markedLines.map((line) => (
                  <div key={line.id} className="pharmacy-stock__marks-line">
                    <div className="pharmacy-stock__marks-line-name">{line.productName}</div>
                    <PharmacyReceiptMarksPanel
                      line={line}
                      marksByLineId={receiptMarks.marksByLineId}
                      busy={receiptMarks.busyLineId === line.id}
                      disabled={activateMutation.isPending}
                      onAdd={receiptMarks.addMarkToLine}
                      onRemove={receiptMarks.removeMark}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <PharmacyReceiptHeaderModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        t={t}
        suppliers={suppliers}
        initial={receipt}
        saving={updateMutation.isPending}
        onSubmit={(body) => updateMutation.mutate(body)}
      />

      <PharmacyReceiptLineModal
        open={Boolean(editingLine)}
        onClose={() => {
          setEditingLine(null);
          setAboutProduct(null);
        }}
        t={t}
        existingLine={editingLine}
        defaultMarkup={receipt.defaultMarkupPercent ?? 20}
        saving={updateLineMutation.isPending}
        onAboutProduct={() => setAboutProduct(productStubFromReceiptLine(editingLine))}
        onSave={(payload) => updateLineMutation.mutate({ lineId: editingLine.id, payload })}
      />

      <PharmacyProductModal
        open={Boolean(aboutProduct)}
        product={aboutProduct}
        overlayClassName="!z-[60]"
        storeId={receipt.storeId}
        onClose={() => setAboutProduct(null)}
        onDelete={aboutProduct ? () => {
          const current = aboutProduct;
          setAboutProduct(null);
          productDelete.ask(current);
        } : undefined}
        onSaved={() => {
          setAboutProduct(null);
          receiptQuery.refetch();
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

      <PharmacyReceiptActivateModal
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        t={t}
        saving={activateMutation.isPending}
        onConfirm={() => activateMutation.mutate()}
      />
      <PharmacyReceiptDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        t={t}
        saving={deleteDraftMutation.isPending}
        numbers={[receipt.receiptNumber]}
        posted={receipt.status === 'POSTED'}
        onConfirm={() => deleteDraftMutation.mutate()}
      />
      {isDraft ? (
        <>
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
        </>
      ) : null}
      <PharmacyReceiptImportMarksVerifyModal
        open={importMarksAsk.askOpen}
        onClose={importMarksAsk.closeAsk}
        t={t}
        markCount={importMarksAsk.markCount}
        etaSeconds={importMarksAsk.etaSeconds}
        aslEnabled={aslEnabled}
        aslReady={aslReady}
        verifying={importMarksAsk.verifying}
        progress={importMarksAsk.progress}
        resultSummary={importMarksAsk.resultSummary}
        onVerify={importMarksAsk.runVerify}
        onSkip={importMarksAsk.skipVerify}
        onContinueWithoutVerify={importMarksAsk.continueWithoutVerify}
        onDiscard={importMarksAsk.discardMarks}
        onConfirmResult={importMarksAsk.confirmResult}
      />
    </PharmacyStockLayout>
  );
}

function Meta({ label, value }) {
  return (
    <div className="pharmacy-stock__meta">
      <div className="pharmacy-stock__meta-label">{label}</div>
      <div className="pharmacy-stock__meta-value">{value}</div>
    </div>
  );
}
