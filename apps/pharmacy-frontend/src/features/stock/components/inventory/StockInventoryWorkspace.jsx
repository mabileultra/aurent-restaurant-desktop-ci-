import { useMemo } from 'react';
import { BaseButton } from '../../../../components/ui';
import PharmacyStockLayout from '../../../pharmacy-stock/components/PharmacyStockLayout';
import { fmtMoney } from '../../../../utils/formatMoney';
import { inventoryFormReady, summarizeInventory } from '../../utils/inventoryVariance';
import StockInventoryKpis from './StockInventoryKpis';
import StockInventoryLines from './StockInventoryLines';
import StockInventoryMeta from './StockInventoryMeta';
import '../../styles/pharmacy-inventory.css';

export default function StockInventoryWorkspace({ model, paths }) {
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
  const summary = useMemo(() => summarizeInventory(lines), [lines]);
  const ready = inventoryFormReady({ storeId: effectiveStoreId, summary });
  const moneyClass = summary.money < -0.004
    ? 'pharmacy-inv-footer__total--danger'
    : 'pharmacy-inv-footer__total--ok';

  return (
    <PharmacyStockLayout
      backTo={paths.inventoriesReport}
      backLabel={t('stockReports.inventoriesTitle')}
      backIconOnly
      title={t('stockReports.inventoryCreateTitle')}
      subtitle={t('stockReports.inventorySubtitle')}
      badge={(
        <span className="pharmacy-stock__badge pharmacy-stock__badge--draft">
          {t('stockReports.inventoryDraft')}
        </span>
      )}
    >
      <StockInventoryKpis t={t} summary={summary} />
      <StockInventoryMeta
        t={t}
        storeId={storeId}
        onStoreChange={(e) => setStoreId(e.target.value)}
        stores={stores}
        needsStorePick={needsStorePick}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
      />
      <StockInventoryLines
        t={t}
        lines={lines}
        storeId={effectiveStoreId}
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
      />
      <div className="pharmacy-inv-footer">
        <div className="pharmacy-inv-footer__status">
          <span className={ready ? 'pharmacy-inv-footer__status--ok' : undefined}>
            {ready ? t('stockReports.inventoryReady') : t('stockReports.inventoryNotReady')}
          </span>
          <span className={`pharmacy-inv-footer__total ${moneyClass}`}>
            {t('stockReports.inventoryTotalLabel')}: {fmtMoney(summary.money)}
          </span>
        </div>
        <div className="pharmacy-inv-footer__actions">
          <BaseButton variant="secondary" onClick={() => window.print()}>
            {t('stockReports.inventoryPrint')}
          </BaseButton>
          <BaseButton disabled={!ready || isPending} onClick={submit}>
            {t('stockReports.inventorySubmit')}
          </BaseButton>
        </div>
      </div>
    </PharmacyStockLayout>
  );
}
