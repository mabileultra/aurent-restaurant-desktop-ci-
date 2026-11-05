import PharmacyProductModal from './PharmacyProductModal';
import PharmacyBulkNumberModal from './PharmacyBulkNumberModal';
import PharmacyReceiptActivateModal from './PharmacyReceiptActivateModal';
import PharmacyReceiptDeleteModal from './PharmacyReceiptDeleteModal';
import PharmacyReceiptHeaderModal from './PharmacyReceiptHeaderModal';
import PharmacyReceiptLineModal from './PharmacyReceiptLineModal';
import PharmacyReceiptLineDeleteModal from './PharmacyReceiptLineDeleteModal';
import PharmacyReceiptMarkScanModal from './PharmacyReceiptMarkScanModal';
import PharmacyReceiptImportMarksVerifyModal from './PharmacyReceiptImportMarksVerifyModal';
import { productStubFromReceiptLine } from '../utils/productStubFromReceiptLine';

/** Модалки документа прихода — вынесены из страницы (один concern: overlays). */
export default function PharmacyReceiptDocumentModals({
  t,
  receipt,
  isDraft,
  isPosted,
  canEditPrices,
  suppliers,
  editOpen,
  setEditOpen,
  editingLine,
  setEditingLine,
  aboutProduct,
  setAboutProduct,
  lineToDelete,
  setLineToDelete,
  activateOpen,
  setActivateOpen,
  deleteOpen,
  setDeleteOpen,
  markScanOpen,
  setMarkScanOpen,
  updateMutation,
  updateLineMutation,
  removeLineMutation,
  removeSelectedLines,
  activateMutation,
  deleteDraftMutation,
  revalue,
  receiptMarks,
  aslEnabled,
  aslReady,
  importMarksAsk,
  marksProgress,
  onReceiptRefetch,
}) {
  return (
    <>
      <PharmacyReceiptHeaderModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        t={t}
        suppliers={suppliers}
        initial={receipt}
        totalCost={receipt?.totalCost}
        saving={updateMutation.isPending}
        storeLocked={isPosted}
        onSubmit={(body) => updateMutation.mutate(body)}
      />

      <PharmacyReceiptLineModal
        open={Boolean(editingLine) && !aboutProduct}
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
        storeId={receipt.storeId}
        onClose={() => setAboutProduct(null)}
        onSaved={() => {
          setAboutProduct(null);
          onReceiptRefetch?.();
        }}
      />

      <PharmacyReceiptLineDeleteModal
        open={Boolean(lineToDelete)}
        onClose={() => !removeLineMutation.isPending && !removeSelectedLines.isPending && setLineToDelete(null)}
        t={t}
        saving={removeLineMutation.isPending || removeSelectedLines.isPending}
        lineName={lineToDelete?.name}
        posted={isPosted}
        multi={Boolean(lineToDelete?.multi || (lineToDelete?.ids?.length > 1))}
        onConfirm={() => {
          if (!lineToDelete?.ids?.length) return;
          if (lineToDelete.multi || lineToDelete.ids.length > 1) {
            removeSelectedLines.mutate(lineToDelete.ids);
            return;
          }
          removeLineMutation.mutate(lineToDelete.ids[0]);
        }}
      />

      <PharmacyReceiptActivateModal
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        t={t}
        saving={activateMutation.isPending}
        marksProgress={marksProgress}
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

      {canEditPrices ? (
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

      <PharmacyReceiptMarkScanModal
        open={isDraft && markScanOpen}
        onClose={() => setMarkScanOpen(false)}
        t={t}
        lines={receipt?.lines ?? []}
        marksByLineId={receiptMarks.marksByLineId}
        storeId={receipt?.storeId}
        aslEnabled={aslEnabled}
        acceptVerifiedMark={receiptMarks.acceptVerifiedMark}
        onRemove={receiptMarks.removeMark}
        disabled={activateMutation.isPending}
      />

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
    </>
  );
}
