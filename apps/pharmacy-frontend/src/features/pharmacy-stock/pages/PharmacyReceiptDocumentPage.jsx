import { BaseButton } from '../../../components/ui';
import PharmacyReceiptDocumentCard from '../components/PharmacyReceiptDocumentCard';
import PharmacyReceiptDocumentLinesPanel from '../components/PharmacyReceiptDocumentLinesPanel';
import PharmacyReceiptDocumentModals from '../components/PharmacyReceiptDocumentModals';
import PharmacyReceiptMarksBar from '../components/PharmacyReceiptMarksBar';
import PharmacyStockLayout, { PharmacyStatusBadge } from '../components/PharmacyStockLayout';
import { usePharmacyReceiptDocumentPage } from '../hooks/usePharmacyReceiptDocumentPage';
import { PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import PharmacyReceiptDocumentAddFlow from '../components/PharmacyReceiptDocumentAddFlow';
import '../styles/pharmacy-import-marks-ask.css';
import '../styles/pharmacy-receipt-marks-bar.css';

export default function PharmacyReceiptDocumentPage() {
  const d = usePharmacyReceiptDocumentPage();
  const { t, receipt, receiptQuery } = d;

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

  return (
    <PharmacyStockLayout
      backTo={PHARMACY_STOCK_PATHS.receipts}
      backLabel={t('pharmacyStock.backToList')}
      backIconOnly
      title={`${t('pharmacyStock.documentTitle')} · ${receipt.receiptNumber}`}
      badge={<PharmacyStatusBadge status={receipt.status} t={t} />}
      subtitle={[receipt.storeName, receipt.supplierName].filter(Boolean).join(' · ') || undefined}
      actions={d.isDraft ? (
        <BaseButton onClick={d.openActivate} disabled={!receipt.lines?.length}>
          {t('pharmacyStock.activate')}
        </BaseButton>
      ) : null}
    >
      {!d.canActivate && d.isDraft && receipt.lines?.length ? (
        <p className="pharmacy-stock__alert">{t('pharmacyStock.activateNeedLots')}</p>
      ) : null}
      {receipt.receiptType === 'OPENING' ? (
        <p className="pharmacy-stock__alert pharmacy-stock__alert--info">
          {t('pharmacyStock.openingDocumentBanner')}
        </p>
      ) : null}
      {d.isPosted ? (
        <p className="pharmacy-stock__alert">{t('pharmacyStock.postedPricesHint')}</p>
      ) : null}

      <div className="pharmacy-stock__meta-grid">
        <PharmacyReceiptDocumentCard
          t={t}
          receipt={receipt}
          canEdit={d.canEditPrices}
          onEdit={() => d.setEditOpen(true)}
          onDelete={() => d.setDeleteOpen(true)}
          onClose={() => d.navigate(PHARMACY_STOCK_PATHS.receipts)}
          deleteDisabled={d.deleteDraftMutation.isPending}
        />

        <section className="pharmacy-stock__doc-main">
          <PharmacyReceiptDocumentAddFlow
            receiptId={d.id}
            storeId={receipt.storeId}
            defaultMarkup={receipt.defaultMarkupPercent ?? 20}
            isDraft={d.isDraft}
            onRefresh={() => receiptQuery.refetch()}
            marksSlot={(
              <PharmacyReceiptMarksBar
                t={t}
                lines={receipt?.lines ?? []}
                marksByLineId={d.receiptMarks.marksByLineId}
                onScan={() => d.setMarkScanOpen(true)}
              />
            )}
          />

          <PharmacyReceiptDocumentLinesPanel
            receipt={receipt}
            canEditPrices={d.canEditPrices}
            linesPage={d.linesPage}
            linesSelect={d.linesSelect}
            revalue={d.revalue}
            mass={d.mass}
            docTotals={d.docTotals}
            deletingSelected={d.removeSelectedLines.isPending}
            onAskDeleteSelected={() => {
              const rows = d.linesSelect.selectedRows;
              if (!rows.length) return;
              d.setLineToDelete({
                ids: rows.map((row) => row.id),
                name: rows.length === 1
                  ? rows[0].productName
                  : t('pharmacyStock.deleteSelectedConfirm', { count: rows.length }),
                multi: rows.length > 1,
              });
            }}
            onEditLine={d.setEditingLine}
            onAskDeleteLine={(line) => d.setLineToDelete({
              ids: [line.id],
              name: line.productName,
              multi: false,
            })}
            onAboutProduct={d.setAboutProduct}
          />
        </section>
      </div>

      <PharmacyReceiptDocumentModals
        t={t}
        receipt={receipt}
        isDraft={d.isDraft}
        isPosted={d.isPosted}
        canEditPrices={d.canEditPrices}
        suppliers={d.suppliers}
        editOpen={d.editOpen}
        setEditOpen={d.setEditOpen}
        editingLine={d.editingLine}
        setEditingLine={d.setEditingLine}
        aboutProduct={d.aboutProduct}
        setAboutProduct={d.setAboutProduct}
        lineToDelete={d.lineToDelete}
        setLineToDelete={d.setLineToDelete}
        activateOpen={d.activateOpen}
        setActivateOpen={d.setActivateOpen}
        deleteOpen={d.deleteOpen}
        setDeleteOpen={d.setDeleteOpen}
        markScanOpen={d.markScanOpen}
        setMarkScanOpen={d.setMarkScanOpen}
        updateMutation={d.updateMutation}
        updateLineMutation={d.updateLineMutation}
        removeLineMutation={d.removeLineMutation}
        removeSelectedLines={d.removeSelectedLines}
        activateMutation={d.activateMutation}
        deleteDraftMutation={d.deleteDraftMutation}
        revalue={d.revalue}
        receiptMarks={d.receiptMarks}
        aslEnabled={d.aslEnabled}
        aslReady={d.aslReady}
        importMarksAsk={d.importMarksAsk}
        marksProgress={d.marksProgress}
        onReceiptRefetch={() => receiptQuery.refetch()}
      />
    </PharmacyStockLayout>
  );
}
