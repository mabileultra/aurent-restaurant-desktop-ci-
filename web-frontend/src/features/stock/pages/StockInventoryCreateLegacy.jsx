import StockDocumentPageHeader from '../components/document-create/StockDocumentPageHeader';
import StockInventoryMetaPanel from '../components/document-create/StockInventoryMetaPanel';
import StockInventoryLinesEditor from '../components/document-create/StockInventoryLinesEditor';
import StockDocumentSubmitButton from '../components/document-create/StockDocumentSubmitButton';

/** Restaurant OS still uses the previous document form. Retail and pharmacy use StockInventoryWorkspace. */
export default function StockInventoryCreateLegacy({ model, paths }) {
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
  } = model;

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
