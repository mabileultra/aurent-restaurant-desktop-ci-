export function mapPlatformAnalyticsStores(api, fallbackPeriod = '7d') {
  return {
    period: api?.period || fallbackPeriod,
    periodLabel: api?.periodFrom && api?.periodTo
      ? `${formatDateLabel(api.periodFrom)} – ${formatDateLabel(api.periodTo)}`
      : fallbackPeriod,
    stores: (api?.stores || []).map((s) => ({
      storeId: s.storeId,
      name: s.name,
      turnover: Number(s.turnover ?? 0),
      profit: Number(s.profit ?? 0),
      receipts: Number(s.receipts ?? 0),
      avgCheck: Number(s.avgCheck ?? 0),
      growthPct: s.growthPct == null ? null : Number(s.growthPct),
    })),
    topByTurnover: (api?.topByTurnover || []).map((s) => ({
      storeId: s.storeId,
      name: s.name,
      value: Number(s.value ?? 0),
    })),
    topByProfit: (api?.topByProfit || []).map((s) => ({
      storeId: s.storeId,
      name: s.name,
      value: Number(s.value ?? 0),
    })),
  };
}

function formatDateLabel(iso) {
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
