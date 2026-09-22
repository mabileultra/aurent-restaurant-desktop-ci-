import { Link } from 'react-router-dom';
import { ArrowUpRight, ChefHat } from 'lucide-react';
import { isKitchenTicketSlow } from '../../config/dashboardKitchenConfig';
import { DASH_PANEL_PAGE_SIZE } from '../../config/dashboardPanelLimits';
import DashboardPanelPager from './DashboardPanelPager';

export default function DashboardLiveKitchen({ t, d }) {
  const rows = d?.kitchenQueue ?? [];
  return (
    <section className="rst-dash__panel">
      <div className="rst-dash__panel-head">
        <h2><ChefHat size={16} strokeWidth={2.2} aria-hidden />{t('rst.dashboard.liveKitchenTitle')}</h2>
        <Link to="/rst/kitchen">{t('rst.dashboard.openKitchen')} <ArrowUpRight size={14} aria-hidden /></Link>
      </div>
      <ul className="rst-dash__stat-list">
        <li>{t('rst.dashboard.kitchenNew', { count: d?.kitchenNew ?? 0 })}</li>
        <li>{t('rst.dashboard.kitchenPrep', { count: d?.kitchenPreparing ?? 0 })}</li>
        <li>{t('rst.dashboard.kitchenReady', { count: d?.kitchenReady ?? 0 })}</li>
      </ul>
      {rows.length === 0 ? (
        <div className="rst-empty">{t('rst.dashboard.liveKitchenEmpty')}</div>
      ) : (
        <DashboardPanelPager items={rows} pageSize={DASH_PANEL_PAGE_SIZE.liveKitchen} t={t}>
          {(pageRows, pager) => (
            <>
              <ul className="rst-dash__live-list">
                {pageRows.map((row) => {
                  const slow = isKitchenTicketSlow(row.ageMinutes);
                  return (
                    <li key={`${row.orderNo}-${row.status}`} className={slow ? 'is-slow' : undefined}>
                      <strong>#{row.orderNo}</strong>
                      <span>{t('rst.dashboard.tableLabel', { code: row.tableCode })}</span>
                      <em>{t('rst.dashboard.minutesShort', { count: row.ageMinutes })}</em>
                    </li>
                  );
                })}
              </ul>
              {pager}
            </>
          )}
        </DashboardPanelPager>
      )}
    </section>
  );
}
