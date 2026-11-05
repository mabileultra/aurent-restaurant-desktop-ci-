import AdminDocumentKpiCard from '../../../../components/admin-document/AdminDocumentKpiCard';
import { fmtMoney } from '../../../../utils/formatMoney';

export default function StockInventoryKpis({ t, summary }) {
  const moneyTone = summary.money < -0.004 ? 'danger' : summary.money > 0.004 ? 'ok' : 'default';
  const moneyHint = summary.money < -0.004
    ? t('stockReports.inventoryWriteOffHint')
    : summary.money > 0.004
      ? t('stockReports.inventorySurplusHint')
      : t('stockReports.inventoryMoneyHint');

  return (
    <section className="admin-doc-kpis" aria-label={t('stockReports.inventoryCreateTitle')}>
      <AdminDocumentKpiCard
        label={t('stockReports.inventoryKpiTotal')}
        value={summary.total}
        hint={t('stockReports.inventoryKpiTotalHint')}
      />
      <AdminDocumentKpiCard
        label={t('stockReports.inventoryKpiMatch')}
        value={summary.match}
        hint={summary.readyLines ? t('stockReports.inventoryKpiMatchHint', { pct: matchPct(summary) }) : t('stockReports.inventoryKpiPending')}
        tone="ok"
      />
      <AdminDocumentKpiCard
        label={t('stockReports.inventoryKpiDiff')}
        value={summary.withDiff}
        hint={t('stockReports.inventoryKpiDiffHint', { shortage: summary.shortage, surplus: summary.surplus })}
        tone={summary.withDiff ? 'warn' : 'default'}
      />
      <AdminDocumentKpiCard
        label={t('stockReports.inventoryKpiSum')}
        value={fmtMoney(summary.money)}
        hint={moneyHint}
        tone={moneyTone}
      />
    </section>
  );
}

function matchPct(summary) {
  if (!summary.readyLines) return 0;
  return Math.round((summary.match / summary.readyLines) * 100);
}
