import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
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
  formatAnalyticsDelta,
  formatAnalyticsMoney,
} from '../../utils/formatAnalyticsMoney';

const PAY_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#ea580c', '#94a3b8'];

function Delta({ value }) {
  const text = formatAnalyticsDelta(value);
  if (!text) return null;
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return <span className={`pa-delta pa-delta--${tone}`}>{text}</span>;
}

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`pa-card ${className}`.trim()}>
      {(title || action) ? (
        <header className="pa-card__head">
          {title ? <h3 className="pa-card__title">{title}</h3> : null}
          {action || null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

function DayTooltip({ active, payload, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="pa-tooltip">
      <p className="pa-tooltip__title">
        {row.best ? t('platform.analytics.overview.bestDay') : row.label}
      </p>
      <ul>
        <li>{t('platform.analytics.kpi.turnover')}: <b>{formatAnalyticsMoney(row.turnover, t)}</b></li>
        <li>{t('platform.analytics.kpi.profit')}: <b>{formatAnalyticsMoney(row.profit, t)}</b></li>
        <li>{t('platform.analytics.kpi.receipts')}: <b>{formatAnalyticsCount(row.receipts)}</b></li>
        <li>{t('platform.analytics.kpi.avgCheck')}: <b>{formatAnalyticsMoney(row.avgCheck, t)}</b></li>
      </ul>
    </div>
  );
}

export default function AnalyticsOverview({ t, data }) {
  const seeAll = (to) => (
    <Link to={to} className="pa-link">{t('platform.analytics.seeAll')}</Link>
  );

  const kpiDefs = [
    { key: 'turnover', money: true },
    { key: 'profit', money: true },
    { key: 'salesQty', money: false },
    { key: 'receipts', money: false },
    { key: 'avgCheck', money: true },
    { key: 'returns', money: true },
  ];

  return (
    <div className="pa-overview">
      {data.demo ? (
        <p className="pa-demo-banner" role="status">
          {t('platform.analytics.demoBanner')}
        </p>
      ) : null}

      <div className="pa-kpi-grid">
        {kpiDefs.map(({ key, money }) => {
          const row = data.kpi[key];
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

      <div className={`pa-grid pa-grid--charts${data.heatmap?.rows?.length || data.hourly?.bars?.length ? '' : ' pa-grid--charts-solo'}`}>
        <Card
          className="pa-span-2"
          title={t('platform.analytics.overview.dailyTitle')}
          action={data.daily.find((d) => d.best) ? (
            <span className="pa-chip pa-chip--best">
              {t('platform.analytics.overview.bestDayHint', {
                day: data.daily.find((d) => d.best).label,
                sum: formatAnalyticsMoney(data.daily.find((d) => d.best).turnover, t),
              })}
            </span>
          ) : null}
        >
          <div className="pa-chart pa-chart--lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="paTurnover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis hide />
                <Tooltip content={<DayTooltip t={t} />} />
                <Area
                  type="monotone"
                  dataKey="turnover"
                  stroke="#16a34a"
                  fill="url(#paTurnover)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#2563eb"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {data.heatmap?.rows?.length ? (
          <Card title={t('platform.analytics.overview.heatmapTitle')}>
            <div
              className="pa-heatmap"
              style={{ gridTemplateColumns: `3.5rem repeat(${data.heatmap.days.length}, 1fr)` }}
            >
              <div className="pa-heatmap__corner" />
              {data.heatmap.days.map((d) => (
                <div key={d} className="pa-heatmap__head">{d}</div>
              ))}
              {data.heatmap.rows.map((row) => (
                <div key={row.band} className="pa-heatmap__band">
                  <div className="pa-heatmap__row-label">{row.band}</div>
                  {row.cells.map((v, i) => (
                    <div
                      key={`${row.band}-${i}`}
                      className="pa-heatmap__cell"
                      style={{
                        background: `color-mix(in srgb, #ef4444 ${Math.round(v * 70)}%, #bbf7d0 ${Math.round((1 - v) * 100)}%)`,
                      }}
                      title={`${row.band} / ${data.heatmap.days[i]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="pa-muted pa-heatmap__legend">{t('platform.analytics.overview.heatmapLegend')}</p>
          </Card>
        ) : null}

        {data.hourly?.bars?.length ? (
          <Card title={t('platform.analytics.overview.hourlyTitle')}>
            <div className="pa-chart pa-chart--md">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly.bars}>
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.hourly.bars.map((b) => (
                      <Cell
                        key={b.hour}
                        fill={b.hour === '18' || b.hour === '20' ? '#16a34a' : '#86efac'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="pa-peak">
              {t('platform.analytics.overview.peak', {
                range: data.hourly.peakLabel,
                sum: formatAnalyticsMoney(data.hourly.peakTurnover, t),
                pct: data.hourly.peakSharePct,
              })}
            </p>
          </Card>
        ) : null}
      </div>

      <div className="pa-grid pa-grid--4">
        <Card title={t('platform.analytics.overview.topStores')} action={seeAll('/platform/analytics/stores')}>
          <ol className="pa-rank">
            {data.topStores.map((row, i) => (
              <li key={row.name}>
                <span className="pa-rank__n">{i + 1}</span>
                <span className="pa-rank__name">{row.name}</span>
                <span className="pa-rank__val">{formatAnalyticsMoney(row.turnover, t)}</span>
                <Delta value={row.deltaPct} />
              </li>
            ))}
          </ol>
        </Card>

        <Card title={t('platform.analytics.overview.topProductsQty')} action={seeAll('/platform/analytics/products')}>
          <ol className="pa-rank">
            {data.topProductsQty.map((row, i) => (
              <li key={row.name}>
                <span className="pa-rank__n">{i + 1}</span>
                <span className="pa-rank__name">{row.name}</span>
                <span className="pa-rank__val">{formatAnalyticsCount(row.qty)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title={t('platform.analytics.overview.topProductsProfit')} action={seeAll('/platform/analytics/products')}>
          <ol className="pa-rank">
            {data.topProductsProfit.map((row, i) => (
              <li key={row.name}>
                <span className="pa-rank__n">{i + 1}</span>
                <span className="pa-rank__name">{row.name}</span>
                <span className="pa-rank__val">{formatAnalyticsMoney(row.profit, t)}</span>
              </li>
            ))}
          </ol>
        </Card>

        {data.regions?.length ? (
          <Card title={t('platform.analytics.overview.regions')} action={seeAll('/platform/analytics/geography')}>
            <ul className="pa-region">
              {data.regions.map((row) => (
                <li key={row.name}>
                  <div className="pa-region__row">
                    <span>{row.name}</span>
                    <b>{formatAnalyticsMoney(row.turnover, t)}</b>
                  </div>
                  <div className="pa-region__bar">
                    <span style={{ width: `${row.sharePct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <div className="pa-grid pa-grid--4">
        <Card title={t('platform.analytics.overview.weekdays')}>
          <div className="pa-chart pa-chart--md">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekdays}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis hide />
                <Tooltip
                  formatter={(v) => formatAnalyticsMoney(v, t)}
                  labelFormatter={(l) => l}
                />
                <Bar dataKey="turnover" radius={[6, 6, 0, 0]}>
                  {data.weekdays.map((d) => (
                    <Cell key={d.day} fill={d.peak ? '#16a34a' : '#bbf7d0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="pa-peak">
            {t('platform.analytics.overview.weekdayPeak', {
              day: data.weekdays.find((d) => d.peak)?.day,
              pct: data.weekdays.find((d) => d.peak)?.sharePct,
            })}
          </p>
        </Card>

        <Card title={t('platform.analytics.overview.payments')} action={seeAll('/platform/analytics/payments')}>
          <div className="pa-donut-wrap">
            <div className="pa-chart pa-chart--donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.payments}
                    dataKey="sharePct"
                    nameKey="labelKey"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                  >
                    {data.payments.map((p, i) => (
                      <Cell key={p.id} fill={PAY_COLORS[i % PAY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, _n, item) => [`${v}%`, t(`platform.analytics.payments.${item.payload.labelKey}`)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pa-donut-center">
                <span>{formatAnalyticsMoney(data.kpi.turnover.value, t)}</span>
              </div>
            </div>
            <ul className="pa-legend">
              {data.payments.map((p, i) => (
                <li key={p.id}>
                  <i style={{ background: PAY_COLORS[i % PAY_COLORS.length] }} />
                  {t(`platform.analytics.payments.${p.labelKey}`)}
                  <b>{p.sharePct}%</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {data.fiscal && Number(data.fiscal.fiscalTurnover) > 0 ? (
          <Card title={t('platform.analytics.overview.fiscal')} action={seeAll('/platform/analytics/fiscal')}>
            <dl className="pa-fiscal">
              {[
                ['fiscalTurnover', formatAnalyticsMoney(data.fiscal.fiscalTurnover, t)],
                ['fiscalReceipts', formatAnalyticsCount(data.fiscal.fiscalReceipts)],
                ['taxBase', formatAnalyticsMoney(data.fiscal.taxBase, t)],
                ['vat', formatAnalyticsMoney(data.fiscal.vat, t)],
                ['fiscalReturns', formatAnalyticsMoney(data.fiscal.fiscalReturns, t)],
                ['cancelled', formatAnalyticsCount(data.fiscal.cancelled)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{t(`platform.analytics.fiscal.${k}`)}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : null}

        {data.anomalies?.length ? (
          <Card title={t('platform.analytics.overview.anomalies')} action={seeAll('/platform/analytics/anomalies')}>
            <ul className="pa-anomalies">
              {data.anomalies.map((a) => (
                <li key={`${a.title}-${a.detail}`} className={`pa-anomaly pa-anomaly--${a.tone}`}>
                  <strong>{a.title}</strong>
                  <span>{t(`platform.analytics.anomalies.${a.detail}`, { value: a.value })}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
