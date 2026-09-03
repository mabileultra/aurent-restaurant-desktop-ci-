import { fmtMoney } from '../../utils/formatMoney';

export const DASHBOARD_CHART_GRID = '#e2e8f0';
export const DASHBOARD_CHART_TOOLTIP_BG = '#ffffff';
export const DASHBOARD_CHART_TOOLTIP_BORDER = '#e2e8f0';
export const DASHBOARD_CHART_TOOLTIP_LABEL = '#64748b';
export const DASHBOARD_CHART_ACCENT = '#10b981';

/** Деньги дашборда: сум (как в остальном UI), без KES. */
export const formatDashboardMoney = (n) => `${fmtMoney(n)} сум`;

export const ellipsisLabel = (s, max = 18) => {
  const str = String(s ?? '');
  if (str.length <= max) return str;
  return `${str.slice(0, Math.max(0, max - 1))}…`;
};
