import { useMemo, useState } from 'react';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS_EXTENDED } from '../../../../components/shared/TablePagination';
import {
  formatAnalyticsCount,
  formatAnalyticsDelta,
  formatAnalyticsMoney,
} from '../../utils/formatAnalyticsMoney';
import { useAnalyticsTablePage } from '../../hooks/useAnalyticsTablePage';

const SORTS = [
  { id: 'turnover', key: 'turnover' },
  { id: 'profit', key: 'profit' },
  { id: 'receipts', key: 'receipts' },
  { id: 'avgCheck', key: 'avgCheck' },
  { id: 'growth', key: 'growth' },
  { id: 'drop', key: 'drop' },
];

function sortStores(rows, sort) {
  const list = [...rows];
  const num = (v) => Number(v ?? 0);
  switch (sort) {
    case 'profit':
      return list.sort((a, b) => num(b.profit) - num(a.profit));
    case 'receipts':
      return list.sort((a, b) => num(b.receipts) - num(a.receipts));
    case 'avgCheck':
      return list.sort((a, b) => num(b.avgCheck) - num(a.avgCheck));
    case 'growth':
      return list.sort((a, b) => num(b.growthPct) - num(a.growthPct));
    case 'drop':
      return list.sort((a, b) => num(a.growthPct) - num(b.growthPct));
    case 'turnover':
    default:
      return list.sort((a, b) => num(b.turnover) - num(a.turnover));
  }
}

function Delta({ value }) {
  const text = formatAnalyticsDelta(value);
  if (!text) return <span className="pa-muted">—</span>;
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return <span className={`pa-delta pa-delta--${tone}`}>{text}</span>;
}

function RankCard({ title, rows, t }) {
  return (
    <section className="pa-card">
      <header className="pa-card__head">
        <h3 className="pa-card__title">{title}</h3>
      </header>
      <ol className="pa-rank">
        {rows.length === 0 ? (
          <li className="pa-muted">{t('platform.analytics.stores.empty')}</li>
        ) : rows.map((row, i) => (
          <li key={row.storeId ?? row.name}>
            <span className="pa-rank__n">{i + 1}</span>
            <span className="pa-rank__name">{row.name}</span>
            <span className="pa-rank__val">{formatAnalyticsMoney(row.value, t)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function AnalyticsStoresPanel({ t, data }) {
  const [sort, setSort] = useState('turnover');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const filtered = (data?.stores || []).filter((s) => {
      if (!q.trim()) return true;
      return String(s.name || '').toLowerCase().includes(q.trim().toLowerCase());
    });
    return sortStores(filtered, sort);
  }, [data?.stores, q, sort]);

  const { page, setPage, pageSize, setPageSize, total, pageRows } = useAnalyticsTablePage(rows, 20);

  return (
    <div className="pa-stores">
      <div className="pa-grid pa-grid--stores-tops">
        <RankCard
          t={t}
          title={t('platform.analytics.stores.topTurnover')}
          rows={data?.topByTurnover || []}
        />
        <RankCard
          t={t}
          title={t('platform.analytics.stores.topProfit')}
          rows={data?.topByProfit || []}
        />
      </div>

      <section className="pa-card">
        <header className="pa-card__head pa-stores__head">
          <h3 className="pa-card__title">{t('platform.analytics.stores.tableTitle')}</h3>
          <input
            type="search"
            className="pa-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('platform.analytics.stores.search')}
            aria-label={t('platform.analytics.stores.search')}
          />
        </header>

        <div className="pa-sorts" role="group" aria-label={t('platform.analytics.stores.sort')}>
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={sort === s.id ? 'pa-periods__btn is-on' : 'pa-periods__btn'}
              onClick={() => setSort(s.id)}
            >
              {t(`platform.analytics.stores.sorts.${s.key}`)}
            </button>
          ))}
        </div>

        <div className="pa-table-wrap">
          <table className="pa-table">
            <thead>
              <tr>
                <th>{t('platform.analytics.stores.colStore')}</th>
                <th>{t('platform.analytics.kpi.turnover')}</th>
                <th>{t('platform.analytics.kpi.profit')}</th>
                <th>{t('platform.analytics.kpi.receipts')}</th>
                <th>{t('platform.analytics.kpi.avgCheck')}</th>
                <th>{t('platform.analytics.stores.colGrowth')}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pa-muted">{t('platform.analytics.stores.empty')}</td>
                </tr>
              ) : pageRows.map((row) => (
                <tr key={row.storeId ?? row.name}>
                  <td className="pa-table__name">{row.name}</td>
                  <td>{formatAnalyticsMoney(row.turnover, t)}</td>
                  <td>{formatAnalyticsMoney(row.profit, t)}</td>
                  <td>{formatAnalyticsCount(row.receipts)}</td>
                  <td>{formatAnalyticsMoney(row.avgCheck, t)}</td>
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
