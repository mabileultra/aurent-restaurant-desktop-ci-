import RstModal from '../../../restaurant/shared/components/RstModal';
import StockInventoryMetaPanel from './document-create/StockInventoryMetaPanel';
import StockInventoryLinesEditor from './document-create/StockInventoryLinesEditor';
import { useStockInventoryCreatePage } from '../hooks/useStockInventoryCreatePage';
import '../styles/stock-doc-form.css';

/** Создание инвентаризации через RstModal. */
export default function StockInventoryCreateModal({ open, onClose, onCreated }) {
  const model = useStockInventoryCreatePage({ asModal: true, onCreated, onClose });
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
    <RstModal
      open={open}
      onClose={onClose}
      title={t('stockReports.inventoryCreateTitle')}
      size="xl"
      cancelLabel={t('common.cancel')}
      submitLabel={isPending ? t('common.saving') : t('stockReports.inventorySubmit')}
      onSubmit={submit}
      isPending={isPending}
    >
      <div className="rst-modal-form rst-stock-doc-form">
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
      </div>
    </RstModal>
  );
}
