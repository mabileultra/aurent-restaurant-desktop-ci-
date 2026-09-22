import { Package, TrendingDown, TrendingUp, AlertTriangle, Warehouse } from 'lucide-react';

function numOrZero(v) {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function buildStockDashboardCards(t, data, paths) {
  return [
    {
      key: 'stock',
      icon: Warehouse,
      label: t('stockReports.kpiStock'),
      units: numOrZero(data?.currentStockUnits),
      money: moneyOrNull(data?.currentStockCostEstimate),
      tone: 'amber',
      to: paths?.balances,
    },
    {
      key: 'received',
      icon: TrendingUp,
      label: t('stockReports.kpiReceived'),
      units: numOrZero(data?.receivedUnits),
      money: moneyOrNull(data?.receivedCostEstimate),
      tone: 'emerald',
      to: paths?.receipts,
    },
    {
      key: 'sold',
      icon: Package,
      label: t('stockReports.kpiSold'),
      units: numOrZero(data?.soldUnits),
      tone: 'blue',
    },
    {
      key: 'writeOff',
      icon: TrendingDown,
      label: t('stockReports.kpiWriteOff'),
      units: numOrZero(data?.writeOffUnits),
      money: moneyOrNull(data?.writeOffCostEstimate),
      tone: 'red',
      to: paths?.writeOffs,
    },
    {
      key: 'low',
      icon: AlertTriangle,
      label: t('stockReports.kpiLow'),
      units: numOrZero(data?.lowStockSkuCount),
      tone: 'orange',
      to: paths?.balances,
    },
  ];
}
