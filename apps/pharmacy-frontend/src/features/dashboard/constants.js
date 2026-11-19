import { CHART_PALETTE } from '../../config/chartPalette';
import { fmtMoney } from '../../utils/formatMoney';

export const DASHBOARD_CHART_GRID = CHART_PALETTE.grid;
export const DASHBOARD_CHART_TOOLTIP_BG = CHART_PALETTE.surface;
export const DASHBOARD_CHART_TOOLTIP_BORDER = CHART_PALETTE.grid;
export const DASHBOARD_CHART_TOOLTIP_LABEL = CHART_PALETTE.axisText;
export const DASHBOARD_CHART_ACCENT = CHART_PALETTE.primary;
export const DASHBOARD_CHART_AXIS = CHART_PALETTE.axisText;

/** Dashboard money format (UZS). */
export const formatDashboardMoney = (n) => `${fmtMoney(n)} сум`;

export const ellipsisLabel = (s, max = 18) => {
  const str = String(s ?? '');
  if (str.length <= max) return str;
  return `${str.slice(0, Math.max(0, max - 1))}…`;
};
