import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';

const GRID = '#3a4049';
const MUTED = '#9b968c';
const BAR = '#ff7a1a';
const TIP_BG = '#22262c';
const TIP_BORDER = '#3a4049';

function buildHourSeries(byHour = []) {
  const map = new Map((byHour ?? []).map((row) => [Number(row.hour), row]));
  return Array.from({ length: 24 }, (_, hour) => {
    const row = map.get(hour);
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      amount: Number(row?.amount ?? 0),
    };
  }).filter((row, index, all) => {
    const hasAny = all.some((r) => r.amount > 0);
    if (!hasAny) return index >= 10 && index <= 22;
    const first = all.findIndex((r) => r.amount > 0);
    const last = [...all].reverse().findIndex((r) => r.amount > 0);
    const lastIdx = all.length - 1 - last;
    return index >= Math.max(0, first - 1) && index <= Math.min(23, lastIdx + 1);
  });
}

export default function DashboardHourChart({ t, byHour }) {
  const hourData = useMemo(() => buildHourSeries(byHour), [byHour]);
  const empty = hourData.every((row) => row.amount === 0);

  return (
    <section className="rst-dash__panel rst-dash__panel--chart">
      <div className="rst-dash__panel-head">
        <div>
          <h2><BarChart3 size={16} strokeWidth={2.2} aria-hidden />{t('rst.dashboard.hourChartTitle')}</h2>
          <p>{t('rst.dashboard.hourChartHint')}</p>
        </div>
      </div>
      {empty ? (
        <div className="rst-empty">{t('rst.dashboard.chartEmpty')}</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={hourData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: MUTED, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmtMoneyCompact(v)}
              width={64}
            />
            <Tooltip
              contentStyle={{ background: TIP_BG, border: `1px solid ${TIP_BORDER}`, borderRadius: 8 }}
              labelStyle={{ color: MUTED }}
              formatter={(value) => [fmtMoneyCompact(value), t('rst.dashboard.revenue')]}
            />
            <Bar dataKey="amount" fill={BAR} radius={[6, 6, 0, 0]} maxBarSize={28} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
