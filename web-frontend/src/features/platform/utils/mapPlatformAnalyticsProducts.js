export function mapPlatformAnalyticsProducts(api, fallbackPeriod = '7d') {
  const kpi = api?.kpi || {};
  return {
    period: api?.period || fallbackPeriod,
    periodLabel: api?.periodFrom && api?.periodTo
      ? `${formatDateLabel(api.periodFrom)} – ${formatDateLabel(api.periodTo)}`
      : fallbackPeriod,
    kpi: {
      soldQty: Number(kpi.soldQty ?? 0),
      revenue: Number(kpi.revenue ?? 0),
      cost: Number(kpi.cost ?? 0),
      profit: Number(kpi.profit ?? 0),
      marginPct: Number(kpi.marginPct ?? 0),
    },
    products: (api?.products || []).map((p) => ({
      name: p.name,
      qty: Number(p.qty ?? 0),
      revenue: Number(p.revenue ?? 0),
      cost: Number(p.cost ?? 0),
      profit: Number(p.profit ?? 0),
      marginPct: Number(p.marginPct ?? 0),
      growthPct: p.growthPct == null ? null : Number(p.growthPct),
    })),
    topByQty: mapRank(api?.topByQty),
    topByProfit: mapRank(api?.topByProfit),
    rising: mapRank(api?.rising),
    falling: mapRank(api?.falling),
    categories: (api?.categories || []).map((c) => ({
      name: c.name,
      qty: Number(c.qty ?? 0),
      revenue: Number(c.revenue ?? 0),
      profit: Number(c.profit ?? 0),
    })),
  };
}

function mapRank(rows) {
  return (rows || []).map((r) => ({
    name: r.name,
    value: Number(r.value ?? 0),
  }));
}

function formatDateLabel(iso) {
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
