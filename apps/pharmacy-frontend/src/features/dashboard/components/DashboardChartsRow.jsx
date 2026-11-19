import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { EmptyState } from '../../../components/ui';
import { CHART_PALETTE } from '../../../config/chartPalette';
import {
  DASHBOARD_CHART_ACCENT,
  DASHBOARD_CHART_AXIS,
  DASHBOARD_CHART_GRID,
  DASHBOARD_CHART_TOOLTIP_BG,
  DASHBOARD_CHART_TOOLTIP_BORDER,
  DASHBOARD_CHART_TOOLTIP_LABEL,
  ellipsisLabel,
  formatDashboardMoney,
} from '../constants';

export default function DashboardChartsRow({ t, periodReport, topProducts }) {
  const fmt = formatDashboardMoney;
  const dailyRows = periodReport?.dailyBreakdown ?? [];
  const topRows = topProducts ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="ui-card-padded lg:col-span-2">
        <h2 className="mb-4 text-base font-semibold text-ink">{t('dashboard.revenueChart')}</h2>
        {dailyRows.length === 0 ? (
          <EmptyState icon={TrendingUp} title={t('common.noData')} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyRows}>
              <defs>
                <linearGradient id="dashboard-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={DASHBOARD_CHART_ACCENT} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={DASHBOARD_CHART_ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_CHART_GRID} />
              <XAxis
                dataKey="date"
                tick={{ fill: DASHBOARD_CHART_AXIS, fontSize: 12, fontFamily: CHART_PALETTE.fontFamily }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: DASHBOARD_CHART_AXIS, fontSize: 12, fontFamily: CHART_PALETTE.fontFamily }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: DASHBOARD_CHART_TOOLTIP_BG,
                  border: `1px solid ${DASHBOARD_CHART_TOOLTIP_BORDER}`,
                  borderRadius: 10,
                }}
                labelStyle={{ color: DASHBOARD_CHART_TOOLTIP_LABEL }}
                formatter={(v) => [fmt(v), t('dashboard.revenue')]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={DASHBOARD_CHART_ACCENT}
                fill="url(#dashboard-rev)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="ui-card-padded">
        <h2 className="mb-4 text-base font-semibold text-ink">{t('dashboard.topProducts')}</h2>
        {topRows.length === 0 ? (
          <EmptyState icon={BarChart3} title={t('common.noData')} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={topRows}
              layout="vertical"
              margin={{ top: 6, right: 10, bottom: 6, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_CHART_GRID} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: DASHBOARD_CHART_AXIS, fontSize: 11, fontFamily: CHART_PALETTE.fontFamily }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="productName"
                tick={{ fill: DASHBOARD_CHART_AXIS, fontSize: 11, fontFamily: CHART_PALETTE.fontFamily }}
                tickLine={false}
                width={150}
                tickFormatter={(v) => ellipsisLabel(v, 22)}
              />
              <Tooltip
                contentStyle={{
                  background: DASHBOARD_CHART_TOOLTIP_BG,
                  border: `1px solid ${DASHBOARD_CHART_TOOLTIP_BORDER}`,
                  borderRadius: 10,
                }}
                formatter={(v) => [v, t('dashboard.unitsSold')]}
              />
              <Bar dataKey="quantitySold" fill={DASHBOARD_CHART_ACCENT} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
