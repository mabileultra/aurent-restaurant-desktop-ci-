import { Link } from 'react-router-dom';
import { ArrowUpRight, LayoutGrid } from 'lucide-react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { DASH_PANEL_PAGE_SIZE } from '../../config/dashboardPanelLimits';
import DashboardPanelPager from './DashboardPanelPager';

export default function DashboardLiveTables({ t, d }) {
  const rows = d?.liveTables ?? [];
  return (
    <section className="rst-dash__panel">
      <div className="rst-dash__panel-head">
        <h2><LayoutGrid size={16} strokeWidth={2.2} aria-hidden />{t('rst.dashboard.liveTablesTitle')}</h2>
        <Link to="/rst/pos">{t('rst.dashboard.openFloor')} <ArrowUpRight size={14} aria-hidden /></Link>
      </div>
      <ul className="rst-dash__stat-list">
        <li><span className="rst-dash__dot is-free" />{t('rst.dashboard.tableFree', { count: d?.freeTables ?? 0 })}</li>
        <li><span className="rst-dash__dot is-busy" />{t('rst.dashboard.tableBusy', { count: d?.occupiedTables ?? 0 })}</li>
        <li><span className="rst-dash__dot is-pay" />{t('rst.dashboard.tablePay', { count: d?.waitingPaymentTables ?? 0 })}</li>
        <li><span className="rst-dash__dot is-reserved" />{t('rst.dashboard.tableReserved', { count: d?.reservedTables ?? 0 })}</li>
      </ul>
      {rows.length === 0 ? (
        <div className="rst-empty">{t('rst.dashboard.liveTablesEmpty')}</div>
      ) : (
        <DashboardPanelPager items={rows} pageSize={DASH_PANEL_PAGE_SIZE.liveTables} t={t}>
          {(pageRows, pager) => (
            <>
              <ul className="rst-dash__live-list">
                {pageRows.map((row) => (
                  <li key={`${row.tableCode}-${row.openMinutes}`}>
                    <strong>{t('rst.dashboard.tableLabel', { code: row.tableCode })}</strong>
                    <span>{fmtMoneyCompact(row.amount)}</span>
                    <em>{t('rst.dashboard.minutesShort', { count: row.openMinutes })}</em>
                  </li>
                ))}
              </ul>
              {pager}
            </>
          )}
        </DashboardPanelPager>
      )}
    </section>
  );
}
