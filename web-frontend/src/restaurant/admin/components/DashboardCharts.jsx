import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
} from 'recharts';
import { fmtMoneyCompact } from '../../../utils/formatMoney';

const GRID = '#3a4049';
const MUTED = '#9b968c';
const BAR = '#4d8fd6';
const LINE = '#ff7a1a';
const TIP_BG = '#22262c';
const TIP_BORDER = '#3a4049';

function buildHourSeries(byHour = []) {
  const map = new Map((byHour ?? []).map((row) => [Number(row.hour), row]));
  return Array.from({ length: 24 }, (_, hour) => {
    const row = map.get(hour);
    const payments = Number(row?.paymentCount ?? 0);
    const amount = Number(row?.amount ?? 0);
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      payments,
      amount,
      avgCheck: payments > 0 ? amount / payments : 0,
    };
  }).filter((row, index, all) => {
    // Keep busy window: first activity through last, else lunch–evening defaults.
    const hasAny = all.some((r) => r.payments > 0 || r.amount > 0);
    if (!hasAny) return index >= 10 && index <= 22;
    const first = all.findIndex((r) => r.payments > 0 || r.amount > 0);
    const last = [...all].reverse().findIndex((r) => r.payments > 0 || r.amount > 0);
    const lastIdx = all.length - 1 - last;
    return index >= Math.max(0, first - 1) && index <= Math.min(23, lastIdx + 1);
  });
}

function buildTopDishes(byDish = []) {
  return [...(byDish ?? [])]
    .sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0))
    .slice(0, 8)
    .map((row) => ({
      name: row.dishName || '—',
      shortName: String(row.dishName || '—').length > 18
        ? `${String(row.dishName).slice(0, 16)}…`
        : (row.dishName || '—'),
      qty: Number(row.quantity ?? 0),
      amount: Number(row.amount ?? 0),
    }));
}

export default function DashboardCharts({ t, byHour, byDish }) {
  const hourData = useMemo(() => buildHourSeries(byHour), [byHour]);
  const dishData = useMemo(() => buildTopDishes(byDish), [byDish]);
  const emptyHours = hourData.every((row) => row.payments === 0 && row.amount === 0);
  const emptyDishes = dishData.length === 0;

  return (
    <div className="rst-dash__charts">
      <div className="rst-dash__chart-card rst-dash__chart-card--wide">
        <div className="rst-dash__chart-head">
          <h2>{t('rst.dashboard.hourChartTitle')}</h2>
          <p>{t('rst.dashboard.hourChartHint')}</p>
        </div>
        {emptyHours ? (
          <div className="rst-empty">{t('rst.dashboard.chartEmpty')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={hourData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fill: MUTED, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: MUTED, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmtMoneyCompact(v)}
              />
              <Tooltip
                contentStyle={{ background: TIP_BG, border: `1px solid ${TIP_BORDER}`, borderRadius: 8 }}
                labelStyle={{ color: '#f3efe6' }}
                formatter={(value, name) => {
                  if (name === 'amount' || name === t('rst.dashboard.revenue')) {
                    return [fmtMoneyCompact(value), t('rst.dashboard.revenue')];
                  }
                  return [value, t('rst.dashboard.payments')];
                }}
              />
              <Legend wrapperStyle={{ color: MUTED }} />
              <Bar
                yAxisId="left"
                dataKey="payments"
                name={t('rst.dashboard.payments')}
                fill={BAR}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="amount"
                name={t('rst.dashboard.revenue')}
                stroke={LINE}
                strokeWidth={2.5}
                dot={{ r: 3, fill: LINE, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        <p className="rst-dash__chart-note">{t('rst.dashboard.hourChartNote')}</p>
      </div>

      <div className="rst-dash__chart-card">
        <div className="rst-dash__chart-head">
          <h2>{t('rst.dashboard.topDishesTitle')}</h2>
          <p>{t('rst.dashboard.topDishesHint')}</p>
        </div>
        {emptyDishes ? (
          <div className="rst-empty">{t('rst.dashboard.chartEmpty')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={dishData}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtMoneyCompact(v)} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={110}
                tick={{ fill: MUTED, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ background: TIP_BG, border: `1px solid ${TIP_BORDER}`, borderRadius: 8 }}
                labelStyle={{ color: '#f3efe6' }}
                formatter={(value, _name, item) => [
                  `${fmtMoneyCompact(value)} · ${item?.payload?.qty ?? 0} ${t('rst.dashboard.units')}`,
                  item?.payload?.name ?? t('rst.dashboard.revenue'),
                ]}
              />
              <Bar dataKey="amount" fill={LINE} radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
