import { useMemo } from 'react';
import {
  AdminDocumentButton,
  AdminDocumentFooter,
  AdminDocumentHeader,
  AdminDocumentTopbar,
} from '../../../../components/admin-document';
import { fmtMoney } from '../../../../utils/formatMoney';
import { inventoryFormReady, summarizeInventory } from '../../utils/inventoryVariance';
import StockInventoryKpis from './StockInventoryKpis';
import StockInventoryLines from './StockInventoryLines';
import StockInventoryMeta from './StockInventoryMeta';

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
  const moneyClass = summary.money < -0.004 ? 'admin-doc-footer__total--danger' : 'admin-doc-footer__total--ok';

  return (
    <div className="admin-page admin-page--full admin-doc">
      <AdminDocumentTopbar
        backTo={paths.inventoriesReport}
        parentLabel={t('stockReports.inventoriesTitle')}
        currentLabel={t('stockReports.inventoryNewCrumb')}
      />
      <AdminDocumentHeader
        title={t('stockReports.inventoryCreateTitle')}
        subtitle={t('stockReports.inventorySubtitle')}
        badge={<span className="admin-doc__badge admin-doc__badge--draft">{t('stockReports.inventoryDraft')}</span>}
      />
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
      <AdminDocumentFooter
        status={(
          <>
            <span className={ready ? 'admin-doc-footer__status--ok' : undefined}>
              {ready ? t('stockReports.inventoryReady') : t('stockReports.inventoryNotReady')}
            </span>
            <span className={`admin-doc-footer__total ${moneyClass}`}>
              {t('stockReports.inventoryTotalLabel')}: {fmtMoney(summary.money)}
            </span>
          </>
        )}
        actions={(
          <>
            <AdminDocumentButton variant="ghost" onClick={() => window.print()}>
              {t('stockReports.inventoryPrint')}
            </AdminDocumentButton>
            <AdminDocumentButton variant="primary" disabled={!ready || isPending} onClick={submit}>
              {t('stockReports.inventorySubmit')}
            </AdminDocumentButton>
          </>
        )}
      />
    </div>
  );
}
