import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { DASH_PANEL_PAGE_SIZE } from '../../config/dashboardPanelLimits';
import DashboardPanelPager from './DashboardPanelPager';

export default function DashboardTopDishes({ t, byDish, mode, onModeChange }) {
  const ranked = useMemo(() => {
    const list = [...(byDish ?? [])];
    if (mode === 'revenue') {
      list.sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0));
    } else {
      list.sort((a, b) => Number(b.quantity ?? 0) - Number(a.quantity ?? 0));
    }
    return list;
  }, [byDish, mode]);

  return (
    <section className="rst-dash__panel">
      <div className="rst-dash__panel-head">
        <h2><Trophy size={16} strokeWidth={2.2} aria-hidden />{t('rst.dashboard.topDishesTitle')}</h2>
        <div className="rst-dash__segment">
          <button
            type="button"
            className={mode === 'qty' ? 'is-active' : undefined}
            onClick={() => onModeChange('qty')}
          >
            {t('rst.dashboard.topByQty')}
          </button>
          <button
            type="button"
            className={mode === 'revenue' ? 'is-active' : undefined}
            onClick={() => onModeChange('revenue')}
          >
            {t('rst.dashboard.topByRevenue')}
          </button>
        </div>
      </div>
      {ranked.length === 0 ? (
        <div className="rst-empty">{t('rst.dashboard.chartEmpty')}</div>
      ) : (
        <DashboardPanelPager items={ranked} pageSize={DASH_PANEL_PAGE_SIZE.topDishes} t={t}>
          {(pageRows, pager) => (
            <>
              <ol className="rst-dash__top-list">
                {pageRows.map((row) => {
                  const rank = ranked.indexOf(row) + 1;
                  return (
                    <li key={`${row.dishName}-${rank}`}>
                      <span className="rst-dash__top-rank">{rank}</span>
                      <span className="rst-dash__top-name">{row.dishName || '—'}</span>
                      <strong>
                        {mode === 'revenue'
                          ? fmtMoneyCompact(row.amount)
                          : t('rst.dashboard.qtyValue', { count: Number(row.quantity ?? 0) })}
                      </strong>
                    </li>
                  );
                })}
              </ol>
              {pager}
            </>
          )}
        </DashboardPanelPager>
      )}
    </section>
  );
}
