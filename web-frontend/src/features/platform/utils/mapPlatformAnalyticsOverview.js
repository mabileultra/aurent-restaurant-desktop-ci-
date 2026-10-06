/** API overview → форма UI AnalyticsOverview. */
export function mapPlatformAnalyticsOverview(api, fallbackPeriod = '7d') {
  const kpi = api?.kpi || {};
  const metric = (m) => ({
    value: Number(m?.value ?? 0),
    deltaPct: m?.deltaPct == null ? null : Number(m.deltaPct),
  });

  return {
    period: api?.period || fallbackPeriod,
    periodLabel: api?.periodFrom && api?.periodTo
      ? `${formatDateLabel(api.periodFrom)} – ${formatDateLabel(api.periodTo)}`
      : fallbackPeriod,
    demo: api?.demo === true,
    kpi: {
      turnover: metric(kpi.turnover),
      profit: metric(kpi.profit),
      salesQty: metric(kpi.salesQty),
      receipts: metric(kpi.receipts),
      avgCheck: metric(kpi.avgCheck),
      returns: metric(kpi.returns),
      activeStores: metric(kpi.activeStores),
    },
    daily: (api?.daily || []).map((d) => ({
      date: d.date,
      label: d.label,
      turnover: Number(d.turnover ?? 0),
      profit: Number(d.profit ?? 0),
      receipts: Number(d.receipts ?? 0),
      avgCheck: Number(d.avgCheck ?? 0),
      best: Boolean(d.best),
    })),
    heatmap: { days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], rows: [] },
    hourly: { peakLabel: '—', peakSharePct: 0, peakTurnover: 0, bars: [] },
    topStores: (api?.topStores || []).map((r) => ({
      name: r.name,
      turnover: Number(r.turnover ?? 0),
      deltaPct: r.deltaPct == null ? null : Number(r.deltaPct),
    })),
    topProductsQty: (api?.topProductsQty || []).map((r) => ({
      name: r.name,
      qty: Number(r.qty ?? 0),
    })),
    topProductsProfit: (api?.topProductsProfit || []).map((r) => ({
      name: r.name,
      profit: Number(r.profit ?? 0),
    })),
    regions: [],
    weekdays: (api?.weekdays || []).map((r) => ({
      day: r.day,
      turnover: Number(r.turnover ?? 0),
      sharePct: Number(r.sharePct ?? 0),
      peak: Boolean(r.peak),
    })),
    payments: (api?.payments || []).map((r) => ({
      id: r.id,
      labelKey: r.id,
      amount: Number(r.amount ?? 0),
      sharePct: Number(r.sharePct ?? 0),
    })),
    fiscal: {
      fiscalTurnover: 0,
      fiscalReceipts: 0,
      taxBase: 0,
      vat: 0,
      fiscalReturns: 0,
      cancelled: 0,
    },
    anomalies: (api?.anomalies || []).map((a) => ({
      tone: a.tone || 'info',
      title: a.title,
      detail: a.detail,
      value: Number(a.value ?? 0),
    })),
  };
}

function formatDateLabel(iso) {
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
