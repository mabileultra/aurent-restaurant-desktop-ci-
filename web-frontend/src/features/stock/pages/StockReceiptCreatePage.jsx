import { useStockReceiptFormPage } from '../hooks/useStockReceiptFormPage';
import { useStockFlowPaths } from '../stockFlowPaths';
import StockDocumentPageHeader from '../components/document-create/StockDocumentPageHeader';
import StockReceiptMetaPanel from '../components/document-create/StockReceiptMetaPanel';
import StockReceiptLinesEditor from '../components/document-create/StockReceiptLinesEditor';
import StockDocumentSubmitButton from '../components/document-create/StockDocumentSubmitButton';

export default function StockReceiptCreatePage() {
  const {
    t,
    isEdit,
    receiptNumber,
    isLoadingReceipt,
    receiptLoadError,
    supplierId,
    setSupplierId,
    storeId,
    setStoreId,
    notes,
    setNotes,
    paymentType,
    setPaymentType,
    lines,
    stores,
    needsStorePick,
    effectiveStoreId,
    supplierList,
    isPending,
    updateLine,
    onProductPick,
    addLine,
    removeLine,
    submit,
  } = useStockReceiptFormPage();
  const paths = useStockFlowPaths();

  if (isLoadingReceipt) {
    return <p className="p-6 text-slate-500">{t('common.loading')}</p>;
  }
  if (receiptLoadError) {
    return <p className="p-6 text-rose-600">{t('stockReports.receiptLoadFailed')}</p>;
  }

  return (
    <div className="admin-page admin-page--full space-y-6">
      <StockDocumentPageHeader
        backTo={paths.receiptsReport}
        backLabel={t('stockReports.receiptsTitle')}
        title={
          isEdit
            ? t('stockReports.receiptEditTitle', { no: receiptNumber || '…' })
            : t('stockReports.receiptCreateTitle')
        }
      />

      <StockReceiptMetaPanel
        t={t}
        supplierId={supplierId}
        onSupplierChange={(e) => setSupplierId(e.target.value)}
        supplierList={supplierList}
        storeId={storeId}
        onStoreChange={(e) => setStoreId(e.target.value)}
        stores={stores}
        needsStorePick={needsStorePick}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
        paymentType={paymentType}
        onPaymentTypeChange={(e) => setPaymentType(e.target.value)}
      />

      <StockReceiptLinesEditor
        t={t}
        lines={lines}
        storeId={effectiveStoreId}
        onProductPick={onProductPick}
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />

      <StockDocumentSubmitButton
        label={isEdit ? t('stockReports.receiptSave') : t('stockReports.receiptSubmit')}
        onClick={submit}
        disabled={isPending}
        variant="full"
      />
    </div>
  );
}
