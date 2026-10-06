export function mapPlatformAnalyticsFiscal(api, fallbackPeriod = '7d') {
  const kpi = api?.kpi || {};
  return {
    period: api?.period || fallbackPeriod,
    periodLabel: api?.periodFrom && api?.periodTo
      ? `${formatDateLabel(api.periodFrom)} – ${formatDateLabel(api.periodTo)}`
      : fallbackPeriod,
    approximate: Boolean(api?.approximate),
    kpi: {
      fiscalTurnover: Number(kpi.fiscalTurnover ?? 0),
      fiscalReceipts: Number(kpi.fiscalReceipts ?? 0),
      avgCheck: Number(kpi.avgCheck ?? 0),
      returnsAmount: Number(kpi.returnsAmount ?? 0),
      returnsReceipts: Number(kpi.returnsReceipts ?? 0),
      cancelledReceipts: Number(kpi.cancelledReceipts ?? 0),
      taxBase: Number(kpi.taxBase ?? 0),
      vat: Number(kpi.vat ?? 0),
      vatAvailable: Boolean(kpi.vatAvailable),
    },
    byStore: (api?.byStore || []).map((s) => ({
      storeId: s.storeId,
      name: s.name || (s.storeId != null ? `Store #${s.storeId}` : '—'),
      turnover: Number(s.turnover ?? 0),
      receipts: Number(s.receipts ?? 0),
      returnsAmount: Number(s.returnsAmount ?? 0),
      cancelledReceipts: Number(s.cancelledReceipts ?? 0),
    })),
  };
}

function formatDateLabel(iso) {
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
