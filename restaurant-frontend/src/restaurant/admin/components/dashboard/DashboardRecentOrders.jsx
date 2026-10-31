import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList } from 'lucide-react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { DASH_PANEL_PAGE_SIZE } from '../../config/dashboardPanelLimits';
import DashboardPanelPager from './DashboardPanelPager';

const STATUS_KEY = {
  OPEN: 'statusOpen',
  BILLING: 'statusBilling',
  CLOSED: 'statusClosed',
  CANCELLED: 'statusCancelled',
};

export default function DashboardRecentOrders({ t, rows, waiterNameById }) {
  return (
    <section className="rst-dash__panel">
      <div className="rst-dash__panel-head">
        <h2><ClipboardList size={16} strokeWidth={2.2} aria-hidden />{t('rst.dashboard.recentOrdersTitle')}</h2>
        <Link to="/rst/admin/delivery">{t('rst.dashboard.showAllOrders')} <ArrowUpRight size={14} aria-hidden /></Link>
      </div>
      {!rows?.length ? (
        <div className="rst-empty">{t('rst.dashboard.recentOrdersEmpty')}</div>
      ) : (
        <DashboardPanelPager items={rows} pageSize={DASH_PANEL_PAGE_SIZE.recentOrders} t={t}>
          {(pageRows, pager) => (
            <>
              <div className="rst-dash__table-wrap">
                <table className="rst-dash__table">
                  <thead>
                    <tr>
                      <th>{t('rst.dashboard.colOrder')}</th>
                      <th>{t('rst.dashboard.colTable')}</th>
                      <th>{t('rst.dashboard.colWaiter')}</th>
                      <th>{t('rst.dashboard.colAmount')}</th>
                      <th>{t('rst.dashboard.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => {
                      const waiter = row.waiterName
                        || (row.waiterUserId
                          ? (waiterNameById.get(String(row.waiterUserId)) || '—')
                          : '—');
                      const statusKey = STATUS_KEY[row.status] || 'statusOpen';
                      return (
                        <tr key={`${row.orderNo}-${row.status}`}>
                          <td>#{row.orderNo}</td>
                          <td>{row.tableCode || '—'}</td>
                          <td>{waiter}</td>
                          <td className="is-num">{fmtMoneyCompact(row.amount)}</td>
                          <td>{t(`rst.dashboard.${statusKey}`)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pager}
            </>
          )}
        </DashboardPanelPager>
      )}
    </section>
  );
}
