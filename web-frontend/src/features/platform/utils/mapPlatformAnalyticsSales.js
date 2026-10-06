export function mapPlatformAnalyticsSales(api, fallbackPeriod = '7d') {
  const kpi = api?.kpi || {};
  return {
    period: api?.period || fallbackPeriod,
    periodLabel: api?.periodFrom && api?.periodTo
      ? `${formatDateLabel(api.periodFrom)} – ${formatDateLabel(api.periodTo)}`
      : fallbackPeriod,
    kpi: {
      turnover: { value: Number(kpi.turnover ?? 0), deltaPct: nOrNull(kpi.turnoverDeltaPct) },
      profit: { value: Number(kpi.profit ?? 0), deltaPct: nOrNull(kpi.profitDeltaPct) },
      receipts: { value: Number(kpi.receipts ?? 0), deltaPct: nOrNull(kpi.receiptsDeltaPct) },
      avgCheck: { value: Number(kpi.avgCheck ?? 0), deltaPct: nOrNull(kpi.avgCheckDeltaPct) },
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
    weekdays: (api?.weekdays || []).map((d) => ({
      day: d.day,
      turnover: Number(d.turnover ?? 0),
      sharePct: Number(d.sharePct ?? 0),
      peak: Boolean(d.peak),
    })),
    hourly: (api?.hourly || []).map((h) => ({
      hour: h.hour,
      turnover: Number(h.turnover ?? 0),
      receipts: Number(h.receipts ?? 0),
      sharePct: Number(h.sharePct ?? 0),
    })),
    hourlyApproximate: Boolean(api?.hourlyApproximate),
    peakDay: api?.peakDay
      ? {
          label: api.peakDay.label,
          turnover: Number(api.peakDay.turnover ?? 0),
          sharePct: Number(api.peakDay.sharePct ?? 0),
        }
      : null,
    peakHour: api?.peakHour
      ? {
          label: api.peakHour.label,
          turnover: Number(api.peakHour.turnover ?? 0),
          sharePct: Number(api.peakHour.sharePct ?? 0),
        }
      : null,
  };
}

function nOrNull(v) {
  return v == null ? null : Number(v);
}

function formatDateLabel(iso) {
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
