import { useStockInventoryCreatePage } from '../hooks/useStockInventoryCreatePage';
import { useStockFlowPaths } from '../stockFlowPaths';
import StockDocumentPageHeader from '../components/document-create/StockDocumentPageHeader';
import StockInventoryMetaPanel from '../components/document-create/StockInventoryMetaPanel';
import StockInventoryLinesEditor from '../components/document-create/StockInventoryLinesEditor';
import StockDocumentSubmitButton from '../components/document-create/StockDocumentSubmitButton';

export default function StockInventoryCreatePage() {
  const {
    t,
    storeId,
    setStoreId,
    notes,
    setNotes,
    lines,
    stores,
    needsStorePick,
    effectiveStoreId,
    isPending,
    updateLine,
    addLine,
    removeLine,
    submit,
  } = useStockInventoryCreatePage();
  const paths = useStockFlowPaths();

  return (
    <div className="admin-page admin-page--full space-y-6">
      <StockDocumentPageHeader
        backTo={paths.inventoriesReport}
        backLabel={t('stockReports.inventoriesTitle')}
        title={t('stockReports.inventoryCreateTitle')}
      />

      <StockInventoryMetaPanel
        t={t}
        storeId={storeId}
        onStoreChange={(e) => setStoreId(e.target.value)}
        stores={stores}
        needsStorePick={needsStorePick}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
      />

      <StockInventoryLinesEditor
        t={t}
        lines={lines}
        storeId={effectiveStoreId}
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />

      <StockDocumentSubmitButton
        label={t('stockReports.inventorySubmit')}
        onClick={submit}
        disabled={isPending}
      />
    </div>
  );
}
