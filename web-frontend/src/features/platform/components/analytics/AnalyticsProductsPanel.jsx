import { useMemo, useState } from 'react';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS_EXTENDED } from '../../../../components/shared/TablePagination';
import {
  formatAnalyticsCount,
  formatAnalyticsDelta,
  formatAnalyticsMoney,
} from '../../utils/formatAnalyticsMoney';
import { useAnalyticsTablePage } from '../../hooks/useAnalyticsTablePage';

const SORTS = [
  { id: 'revenue', key: 'revenue' },
  { id: 'profit', key: 'profit' },
  { id: 'qty', key: 'qty' },
  { id: 'margin', key: 'margin' },
  { id: 'growth', key: 'growth' },
  { id: 'drop', key: 'drop' },
];

function sortProducts(rows, sort) {
  const list = [...rows];
  const num = (v) => Number(v ?? 0);
  switch (sort) {
    case 'profit':
      return list.sort((a, b) => num(b.profit) - num(a.profit));
    case 'qty':
      return list.sort((a, b) => num(b.qty) - num(a.qty));
    case 'margin':
      return list.sort((a, b) => num(b.marginPct) - num(a.marginPct));
    case 'growth':
      return list.sort((a, b) => num(b.growthPct) - num(a.growthPct));
    case 'drop':
      return list.sort((a, b) => num(a.growthPct) - num(b.growthPct));
    case 'revenue':
    default:
      return list.sort((a, b) => num(b.revenue) - num(a.revenue));
  }
}

function Delta({ value }) {
  const text = formatAnalyticsDelta(value);
  if (!text) return <span className="pa-muted">—</span>;
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return <span className={`pa-delta pa-delta--${tone}`}>{text}</span>;
}

function RankCard({ title, rows, t, formatValue }) {
  return (
    <section className="pa-card">
      <header className="pa-card__head">
        <h3 className="pa-card__title">{title}</h3>
      </header>
      <ol className="pa-rank">
        {rows.length === 0 ? (
          <li className="pa-muted">{t('platform.analytics.products.empty')}</li>
        ) : rows.map((row, i) => (
          <li key={row.name}>
            <span className="pa-rank__n">{i + 1}</span>
            <span className="pa-rank__name">{row.name}</span>
            <span className="pa-rank__val">{formatValue(row.value)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function AnalyticsProductsPanel({ t, data }) {
  const [sort, setSort] = useState('revenue');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const filtered = (data?.products || []).filter((p) => {
      if (!q.trim()) return true;
      return String(p.name || '').toLowerCase().includes(q.trim().toLowerCase());
    });
    return sortProducts(filtered, sort);
  }, [data?.products, q, sort]);

  const { page, setPage, pageSize, setPageSize, total, pageRows } = useAnalyticsTablePage(rows, 20);

  const kpi = data?.kpi || {};

  return (
    <div className="pa-products">
      <div className="pa-kpi-grid pa-kpi-grid--5">
        {[
          ['soldQty', formatAnalyticsCount(kpi.soldQty)],
          ['revenue', formatAnalyticsMoney(kpi.revenue, t)],
          ['cost', formatAnalyticsMoney(kpi.cost, t)],
          ['profit', formatAnalyticsMoney(kpi.profit, t)],
          ['margin', `${Number(kpi.marginPct || 0).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`],
        ].map(([key, value]) => (
          <article key={key} className="pa-kpi">
            <p className="pa-kpi__label">{t(`platform.analytics.products.kpi.${key}`)}</p>
            <p className="pa-kpi__value">{value}</p>
          </article>
        ))}
      </div>

      <div className="pa-grid pa-grid--products-tops">
        <RankCard
          t={t}
          title={t('platform.analytics.products.topQty')}
          rows={data?.topByQty || []}
          formatValue={(v) => formatAnalyticsCount(v)}
        />
        <RankCard
          t={t}
          title={t('platform.analytics.products.topProfit')}
          rows={data?.topByProfit || []}
          formatValue={(v) => formatAnalyticsMoney(v, t)}
        />
        <RankCard
          t={t}
          title={t('platform.analytics.products.rising')}
          rows={data?.rising || []}
          formatValue={(v) => `+${Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`}
        />
        <RankCard
          t={t}
          title={t('platform.analytics.products.falling')}
          rows={data?.falling || []}
          formatValue={(v) => `−${Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`}
        />
      </div>

      {data?.categories?.length ? (
        <section className="pa-card">
          <header className="pa-card__head">
            <h3 className="pa-card__title">{t('platform.analytics.products.categories')}</h3>
          </header>
          <ul className="pa-region">
            {data.categories.map((c) => (
              <li key={c.name}>
                <div className="pa-region__row">
                  <span>{c.name}</span>
                  <b>{formatAnalyticsMoney(c.revenue, t)}</b>
                </div>
                <div className="pa-region__bar">
                  <span style={{
                    width: `${Math.min(100, data.kpi.revenue > 0 ? (c.revenue / data.kpi.revenue) * 100 : 0)}%`,
                  }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="pa-card">
        <header className="pa-card__head pa-stores__head">
          <h3 className="pa-card__title">{t('platform.analytics.products.tableTitle')}</h3>
          <input
            type="search"
            className="pa-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('platform.analytics.products.search')}
            aria-label={t('platform.analytics.products.search')}
          />
        </header>

        <div className="pa-sorts" role="group" aria-label={t('platform.analytics.products.sort')}>
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={sort === s.id ? 'pa-periods__btn is-on' : 'pa-periods__btn'}
              onClick={() => setSort(s.id)}
            >
              {t(`platform.analytics.products.sorts.${s.key}`)}
            </button>
          ))}
        </div>

        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th>{t('platform.analytics.products.colProduct')}</th>
                <th>{t('platform.analytics.products.kpi.soldQty')}</th>
                <th>{t('platform.analytics.products.kpi.revenue')}</th>
                <th>{t('platform.analytics.products.kpi.cost')}</th>
                <th>{t('platform.analytics.products.kpi.profit')}</th>
                <th>{t('platform.analytics.products.kpi.margin')}</th>
                <th>{t('platform.analytics.products.colGrowth')}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pa-muted">{t('platform.analytics.products.empty')}</td>
                </tr>
              ) : pageRows.map((row) => (
                <tr key={row.name} className={Number(row.marginPct) < 5 && Number(row.revenue) > 0 ? 'pa-table__row--low-margin' : undefined}>
                  <td className="pa-table__name">{row.name}</td>
                  <td>{formatAnalyticsCount(row.qty)}</td>
                  <td>{formatAnalyticsMoney(row.revenue, t)}</td>
                  <td>{formatAnalyticsMoney(row.cost, t)}</td>
                  <td>{formatAnalyticsMoney(row.profit, t)}</td>
                  <td>{`${Number(row.marginPct).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`}</td>
                  <td><Delta value={row.growthPct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          className="pa-pagination"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS_EXTENDED}
        />
      </section>
    </div>
  );
}
