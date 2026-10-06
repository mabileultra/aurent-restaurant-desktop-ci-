import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatAnalyticsCount,
  formatAnalyticsMoney,
} from '../../utils/formatAnalyticsMoney';

const PAY_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#8b5cf6', '#64748b', '#0ea5e9', '#ef4444'];

function methodLabel(t, row) {
  if (row.labelKey && row.labelKey !== 'other') {
    return t(`platform.analytics.payments.${row.labelKey}`);
  }
  if (row.id && row.id !== 'other') {
    const key = `platform.analytics.payments.${row.id}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return row.labelFallback || t('platform.analytics.payments.other');
}

function DailyTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="pa-tooltip">
      <p className="pa-tooltip__title">{row.label}</p>
      <ul>
        <li>{t('platform.analytics.payments.cash')}: <b>{formatAnalyticsMoney(row.cash, t)}</b></li>
        <li>{t('platform.analytics.payments.card')}: <b>{formatAnalyticsMoney(row.card, t)}</b></li>
        <li>{t('platform.analytics.payments.other')}: <b>{formatAnalyticsMoney(row.other, t)}</b></li>
      </ul>
    </div>
  );
}

export default function AnalyticsPaymentsPanel({ t, data }) {
  const methods = data?.methods || [];

  return (
    <div className="pa-payments">
      <div className="pa-kpi-grid">
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.payments.totalAmount')}</p>
          <p className="pa-kpi__value">{formatAnalyticsMoney(data?.totalAmount, t)}</p>
        </article>
        <article className="pa-kpi">
          <p className="pa-kpi__label">{t('platform.analytics.kpi.receipts')}</p>
          <p className="pa-kpi__value">{formatAnalyticsCount(data?.totalReceipts)}</p>
        </article>
      </div>

      <div className="pa-grid pa-grid--sales-2">
        <section className="pa-card">
          <header className="pa-card__head">
            <h3 className="pa-card__title">{t('platform.analytics.overview.payments')}</h3>
          </header>
          {methods.length === 0 ? (
            <p className="pa-muted">{t('platform.analytics.payments.empty')}</p>
          ) : (
            <div className="pa-donut-wrap">
              <div className="pa-chart pa-chart--donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methods}
                      dataKey="sharePct"
                      nameKey="id"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={2}
                    >
                      {methods.map((p, i) => (
                        <Cell key={p.id} fill={PAY_COLORS[i % PAY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, _n, item) => [
                        `${v}%`,
                        methodLabel(t, item.payload),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pa-donut-center">
                  <span>{formatAnalyticsMoney(data?.totalAmount, t)}</span>
                </div>
              </div>
              <ul className="pa-legend">
                {methods.map((p, i) => (
                  <li key={p.id}>
                    <i style={{ background: PAY_COLORS[i % PAY_COLORS.length] }} />
                    {methodLabel(t, p)}
                    <b>{p.sharePct}%</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="pa-card">
          <header className="pa-card__head">
            <h3 className="pa-card__title">{t('platform.analytics.payments.methodsTitle')}</h3>
          </header>
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead>
                <tr>
                  <th>{t('platform.analytics.payments.colMethod')}</th>
                  <th>{t('platform.analytics.kpi.turnover')}</th>
                  <th>{t('platform.analytics.kpi.receipts')}</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {methods.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="pa-muted">{t('platform.analytics.payments.empty')}</td>
                  </tr>
                ) : methods.map((m) => (
                  <tr key={m.id}>
                    <td>{methodLabel(t, m)}</td>
                    <td>{formatAnalyticsMoney(m.amount, t)}</td>
                    <td>{formatAnalyticsCount(m.receipts)}</td>
                    <td>{m.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="pa-card">
        <header className="pa-card__head">
          <h3 className="pa-card__title">{t('platform.analytics.payments.dailyTitle')}</h3>
        </header>
        <div className="pa-chart pa-chart--lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.daily || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip content={<DailyTooltip t={t} />} />
              <Bar dataKey="cash" stackId="pay" fill="#16a34a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="card" stackId="pay" fill="#2563eb" />
              <Bar dataKey="other" stackId="pay" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
