import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatAnalyticsCount,
  formatAnalyticsDelta,
  formatAnalyticsMoney,
} from '../../utils/formatAnalyticsMoney';

function Delta({ value }) {
  const text = formatAnalyticsDelta(value);
  if (!text) return null;
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return <span className={`pa-delta pa-delta--${tone}`}>{text}</span>;
}

function DayTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="pa-tooltip">
      <p className="pa-tooltip__title">{row.best ? t('platform.analytics.overview.bestDay') : row.label}</p>
      <ul>
        <li>{t('platform.analytics.kpi.turnover')}: <b>{formatAnalyticsMoney(row.turnover, t)}</b></li>
        <li>{t('platform.analytics.kpi.profit')}: <b>{formatAnalyticsMoney(row.profit, t)}</b></li>
        <li>{t('platform.analytics.kpi.receipts')}: <b>{formatAnalyticsCount(row.receipts)}</b></li>
        <li>{t('platform.analytics.kpi.avgCheck')}: <b>{formatAnalyticsMoney(row.avgCheck, t)}</b></li>
      </ul>
    </div>
  );
}

export default function AnalyticsSalesPanel({ t, data }) {
  const kpi = data?.kpi || {};
  const peakHourLabel = data?.peakHour?.label || '—';

  return (
    <div className="pa-sales">
      <div className="pa-kpi-grid">
        {[
          ['turnover', true],
          ['profit', true],
          ['receipts', false],
          ['avgCheck', true],
        ].map(([key, money]) => {
          const row = kpi[key] || {};
          return (
            <article key={key} className="pa-kpi">
              <p className="pa-kpi__label">{t(`platform.analytics.kpi.${key}`)}</p>
              <p className="pa-kpi__value">
                {money ? formatAnalyticsMoney(row.value, t) : formatAnalyticsCount(row.value)}
              </p>
              <Delta value={row.deltaPct} />
            </article>
          );
        })}
      </div>

      {(data?.peakDay || data?.peakHour) ? (
        <div className="pa-sales__peaks">
          {data.peakDay ? (
            <p className="pa-peak">
              {t('platform.analytics.sales.peakDay', {
                day: data.peakDay.label,
                sum: formatAnalyticsMoney(data.peakDay.turnover, t),
                pct: data.peakDay.sharePct,
              })}
            </p>
          ) : null}
          {data.peakHour ? (
            <p className="pa-peak">
              {t('platform.analytics.sales.peakHour', {
                hour: peakHourLabel,
                sum: formatAnalyticsMoney(data.peakHour.turnover, t),
                pct: data.peakHour.sharePct,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="pa-card">
        <header className="pa-card__head">
          <h3 className="pa-card__title">{t('platform.analytics.sales.dailyTitle')}</h3>
        </header>
        <div className="pa-chart pa-chart--lg">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.daily || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="paSalesTurnover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip content={<DayTooltip t={t} />} />
              <Area type="monotone" dataKey="turnover" stroke="#16a34a" fill="url(#paSalesTurnover)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="profit" stroke="#2563eb" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="pa-grid pa-grid--sales-2">
        <section className="pa-card">
          <header className="pa-card__head">
            <h3 className="pa-card__title">{t('platform.analytics.overview.weekdays')}</h3>
          </header>
          <div className="pa-chart pa-chart--md">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weekdays || []}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatAnalyticsMoney(v, t)} />
                <Bar dataKey="turnover" radius={[6, 6, 0, 0]}>
                  {(data?.weekdays || []).map((d) => (
                    <Cell key={d.day} fill={d.peak ? '#16a34a' : '#bbf7d0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="pa-card">
          <header className="pa-card__head">
            <h3 className="pa-card__title">{t('platform.analytics.sales.hourlyTitle')}</h3>
          </header>
          {data?.hourlyApproximate ? (
            <p className="pa-muted">{t('platform.analytics.sales.hourlyHint')}</p>
          ) : null}
          <div className="pa-chart pa-chart--md">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.hourly || []).filter((h) => Number(h.hour) >= 6 && Number(h.hour) <= 23)}>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={10} interval={1} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatAnalyticsMoney(v, t)} />
                <Bar dataKey="turnover" radius={[4, 4, 0, 0]}>
                  {(data?.hourly || [])
                    .filter((h) => Number(h.hour) >= 6 && Number(h.hour) <= 23)
                    .map((h) => (
                      <Cell
                        key={h.hour}
                        fill={data?.peakHour?.label?.startsWith(h.hour) ? '#16a34a' : '#86efac'}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
