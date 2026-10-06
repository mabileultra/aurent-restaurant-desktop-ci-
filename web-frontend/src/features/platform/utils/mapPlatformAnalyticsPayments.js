export function mapPlatformAnalyticsPayments(api, fallbackPeriod = '7d') {
  return {
    period: api?.period || fallbackPeriod,
    periodLabel: api?.periodFrom && api?.periodTo
      ? `${formatDateLabel(api.periodFrom)} – ${formatDateLabel(api.periodTo)}`
      : fallbackPeriod,
    totalAmount: Number(api?.totalAmount ?? 0),
    totalReceipts: Number(api?.totalReceipts ?? 0),
    methods: (api?.methods || []).map((m) => {
      const id = String(m.id || 'other');
      return {
        id,
        labelKey: KNOWN_METHODS.has(id) ? id : 'other',
        labelFallback: m.label || id,
        amount: Number(m.amount ?? 0),
        receipts: Number(m.receipts ?? 0),
        sharePct: Number(m.sharePct ?? 0),
      };
    }),
    daily: (api?.daily || []).map((d) => ({
      date: d.date,
      label: d.label,
      cash: Number(d.cash ?? 0),
      card: Number(d.card ?? 0),
      other: Number(d.other ?? 0),
    })),
  };
}

const KNOWN_METHODS = new Set(['cash', 'card', 'click', 'payme', 'transfer', 'mixed', 'other']);

function formatDateLabel(iso) {
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
