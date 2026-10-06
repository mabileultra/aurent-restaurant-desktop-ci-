/** Демо-данные обзора — форма будущего API `/platform/analytics/overview`. */
export const ANALYTICS_PERIODS = ['today', '7d', '30d', 'month', 'year', 'custom'];

export function buildAnalyticsOverviewDemo(period = '7d') {
  return {
    period,
    periodLabel: period === '7d' ? '01.10.2026 – 07.10.2026' : period,
    demo: true,
    kpi: {
      turnover: { value: 18_400_000_000, deltaPct: 12.4 },
      profit: { value: 3_800_000_000, deltaPct: 15.2 },
      salesQty: { value: 42_850, deltaPct: 8.2 },
      receipts: { value: 31_240, deltaPct: 8.7 },
      avgCheck: { value: 589_000, deltaPct: 4.1 },
      returns: { value: 284_000_000, deltaPct: -2.3 },
      activeStores: { value: 391, deltaPct: null },
    },
    daily: [
      { date: '2026-10-01', label: '01.10', turnover: 2.05e9, profit: 410e6, receipts: 4100, avgCheck: 500_000 },
      { date: '2026-10-02', label: '02.10', turnover: 2.18e9, profit: 430e6, receipts: 4300, avgCheck: 507_000 },
      { date: '2026-10-03', label: '03.10', turnover: 2.22e9, profit: 445e6, receipts: 4400, avgCheck: 504_500 },
      { date: '2026-10-04', label: '04.10', turnover: 2.31e9, profit: 460e6, receipts: 4600, avgCheck: 502_000 },
      { date: '2026-10-05', label: '05.10', turnover: 2.43e9, profit: 482e6, receipts: 4820, avgCheck: 504_149, best: true },
      { date: '2026-10-06', label: '06.10', turnover: 2.28e9, profit: 455e6, receipts: 4550, avgCheck: 501_000 },
      { date: '2026-10-07', label: '07.10', turnover: 2.35e9, profit: 470e6, receipts: 4700, avgCheck: 500_000 },
    ],
    heatmap: {
      days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      rows: [
        { band: '01–03', cells: [0.2, 0.25, 0.3, 0.28, 0.35, 0.55, 0.4] },
        { band: '04–07', cells: [0.35, 0.4, 0.45, 0.5, 0.6, 0.85, 0.55] },
      ],
    },
    hourly: {
      peakLabel: '18:00 – 20:00',
      peakSharePct: 22,
      peakTurnover: 4.1e9,
      bars: [
        { hour: '08', value: 0.35 },
        { hour: '10', value: 0.55 },
        { hour: '12', value: 0.72 },
        { hour: '14', value: 0.68 },
        { hour: '16', value: 0.8 },
        { hour: '18', value: 1 },
        { hour: '20', value: 0.95 },
        { hour: '22', value: 0.45 },
      ],
    },
    topStores: [
      { name: 'MIRONKUL AGRO GLOBAL', turnover: 1.82e9, deltaPct: 24 },
      { name: 'Anvar Bravo', turnover: 1.24e9, deltaPct: 18 },
      { name: 'Samarkand Market', turnover: 0.98e9, deltaPct: 12 },
      { name: 'Ferghana Trade', turnover: 0.86e9, deltaPct: 9 },
      { name: 'Andijan City', turnover: 0.74e9, deltaPct: 6 },
    ],
    topProductsQty: [
      { name: 'Coca-Cola 1L', qty: 24820 },
      { name: 'Pepsi 1L', qty: 21430 },
      { name: 'Хлеб', qty: 18920 },
      { name: 'Молоко 1L', qty: 17820 },
      { name: 'Вода 0.5L', qty: 16740 },
    ],
    topProductsProfit: [
      { name: 'Red Bull 250ml', profit: 182e6 },
      { name: 'Сигареты (блок)', profit: 164e6 },
      { name: 'Nescafe Classic', profit: 143e6 },
      { name: 'Шоколад Toblerone', profit: 128e6 },
      { name: 'Энергетик Flash', profit: 117e6 },
    ],
    regions: [
      { name: 'Ташкент', turnover: 8.2e9, sharePct: 45 },
      { name: 'Самарканд', turnover: 4.7e9, sharePct: 26 },
      { name: 'Фергана', turnover: 2.1e9, sharePct: 11 },
      { name: 'Бухара', turnover: 1.6e9, sharePct: 9 },
      { name: 'Другие', turnover: 1.8e9, sharePct: 9 },
    ],
    weekdays: [
      { day: 'Пн', turnover: 2.1e9, sharePct: 11 },
      { day: 'Вт', turnover: 2.2e9, sharePct: 12 },
      { day: 'Ср', turnover: 2.3e9, sharePct: 13 },
      { day: 'Чт', turnover: 2.4e9, sharePct: 13 },
      { day: 'Пт', turnover: 2.8e9, sharePct: 15 },
      { day: 'Сб', turnover: 4.1e9, sharePct: 22, peak: true },
      { day: 'Вс', turnover: 2.5e9, sharePct: 14 },
    ],
    payments: [
      { id: 'cash', labelKey: 'cash', amount: 5.9e9, sharePct: 32 },
      { id: 'click', labelKey: 'click', amount: 4.4e9, sharePct: 24 },
      { id: 'payme', labelKey: 'payme', amount: 3.9e9, sharePct: 21 },
      { id: 'card', labelKey: 'card', amount: 3.3e9, sharePct: 18 },
      { id: 'other', labelKey: 'other', amount: 0.9e9, sharePct: 5 },
    ],
    fiscal: {
      fiscalTurnover: 17.8e9,
      fiscalReceipts: 29850,
      taxBase: 15.9e9,
      vat: 1.82e9,
      fiscalReturns: 210e6,
      cancelled: 124,
    },
    anomalies: [
      { tone: 'danger', title: 'ABC Market', detail: 'turnoverDown', value: 43 },
      { tone: 'danger', title: 'XYZ Store', detail: 'returnsUp', value: 280 },
      { tone: 'success', title: 'Anvar Bravo', detail: 'salesUp', value: 84 },
      { tone: 'info', title: 'Mineral Water', detail: 'productUp', value: 120 },
    ],
  };
}
