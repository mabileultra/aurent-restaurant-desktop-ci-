import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { useDashboardAdminPage } from '../hooks/useDashboardAdminPage';
import DashboardToolbar from '../components/dashboard/DashboardToolbar';
import DashboardQuickActions from '../components/dashboard/DashboardQuickActions';
import DashboardKpiGrid from '../components/dashboard/DashboardKpiGrid';
import DashboardHourChart from '../components/dashboard/DashboardHourChart';
import DashboardLiveTables from '../components/dashboard/DashboardLiveTables';
import DashboardTopDishes from '../components/dashboard/DashboardTopDishes';
import DashboardLiveKitchen from '../components/dashboard/DashboardLiveKitchen';
import DashboardStockAlerts from '../components/dashboard/DashboardStockAlerts';
import DashboardRecentOrders from '../components/dashboard/DashboardRecentOrders';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/dashboard-toolbar.css';
import '../styles/dashboard-kpi.css';
import '../styles/dashboard-panels.css';

export default function DashboardAdminPage() {
  const p = useDashboardAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-dash">
      <DashboardToolbar
        t={p.t}
        period={p.period}
        onPeriodChange={p.setPeriod}
        customFrom={p.customFrom}
        onCustomFrom={p.setCustomFrom}
        customTo={p.customTo}
        onCustomTo={p.setCustomTo}
        halls={p.halls}
        hallId={p.hallId}
        onHallChange={p.setHallId}
        waiters={p.waiters}
        waiterId={p.waiterId}
        onWaiterChange={p.setWaiterId}
        userLabel={p.user?.fullName || p.user?.username || 'Admin'}
      />

      {p.workspace.isLoading && p.workspace.storeId == null ? null : !p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : p.dashQuery.isError ? (
        <div className="rst-notice">{p.t('rst.admin.dashboardLoadFailed')}</div>
      ) : !p.data ? (
        <div className="rst-empty">{p.t('common.loading')}</div>
      ) : (
        <>
          <DashboardQuickActions t={p.t} actions={p.quickActions} />

          <div className={`rst-dash__chip${p.data.shiftOpen ? ' is-open' : ''}`}>
            {p.data.shiftOpen
              ? p.t('rst.dashboard.shiftOpen', {
                sales: p.data.shiftSaleCount,
                revenue: fmtMoneyCompact(p.data.shiftRevenue),
              })
              : p.t('rst.dashboard.shiftClosed')}
          </div>

          <DashboardKpiGrid t={p.t} d={p.data} />

          <div className="rst-dash__row">
            <DashboardHourChart t={p.t} byHour={p.data.byHour} />
            <DashboardLiveTables t={p.t} d={p.data} />
          </div>

          <div className="rst-dash__row">
            <DashboardTopDishes
              t={p.t}
              byDish={p.data.byDish}
              mode={p.topMode}
              onModeChange={p.setTopMode}
            />
            <DashboardLiveKitchen t={p.t} d={p.data} />
          </div>

          <div className="rst-dash__row">
            <DashboardStockAlerts t={p.t} rows={p.stockAlerts} loading={p.stockLoading} />
            <DashboardRecentOrders
              t={p.t}
              rows={p.recentOrders}
              waiterNameById={p.waiterNameById}
            />
          </div>
        </>
      )}
    </section>
  );
}
