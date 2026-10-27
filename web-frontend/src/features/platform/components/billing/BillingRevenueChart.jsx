import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function BillingRevenueChart({ t, revenue, expected, money, currency }) {
  const k = (key) => t(`platform.billing.collections.reports.${key}`);

  const chartData = [
    {
      period: k('periods.DAY'),
      revenue: Number(revenue?.today || 0),
      expected: Number(expected?.today || 0),
    },
    {
      period: k('periods.WEEK'),
      revenue: Number(revenue?.week || 0),
      expected: Number(expected?.next7Days || 0),
    },
    {
      period: k('periods.MONTH'),
      revenue: Number(revenue?.month || 0),
      expected: Number(expected?.next30Days || 0),
    },
    {
      period: k('periods.YEAR'),
      revenue: Number(revenue?.year || 0),
      expected: 0,
    },
  ];

  const formatTooltipValue = (val) => `${money(val)} ${currency}`;

  return (
    <div className="bc-chart-card">
      <div className="bc-chart-card__head">
        <div>
          <h3 className="bc-chart-card__title">
            {t('platform.billing.collections.reports.dynamicsTitle', { defaultValue: 'Tushum va kutilmalar dinamikasi' })}
          </h3>
          <p className="bc-chart-card__sub">
            {t('platform.billing.collections.reports.dynamicsSub', { defaultValue: 'Haqiqiy tushgan mablag‘lar va yaqin to‘lovlar prognozi' })}
          </p>
        </div>
      </div>

      <div className="bc-chart-container" style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" opacity={0.6} />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--color-muted, #64748b)', fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border, #e2e8f0)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted, #64748b)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : v)}
            />
            <Tooltip
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: 'var(--color-surface, #fff)',
                borderColor: 'var(--color-border, #e2e8f0)',
                borderRadius: '0.6rem',
                fontSize: '0.8125rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                color: 'var(--color-text, #0f172a)',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '0.8125rem' }}
            />
            <Bar
              name={k('revenue')}
              dataKey="revenue"
              fill="var(--color-brand, #006847)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              name={k('expected')}
              dataKey="expected"
              fill="#0284c7"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
