import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { rstAnalyticsApi } from '../../api/analytics.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import DashboardCharts from '../components/DashboardCharts';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/analytics-admin.css';

function dayRangeIso() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function DashboardAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const range = useMemo(() => dayRangeIso(), []);

  const dashQuery = useQuery({
    queryKey: ['rst-dashboard', workspace.storeId],
    queryFn: () => rstAnalyticsApi.dashboard(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
    refetchInterval: 30_000,
  });

  const salesQuery = useQuery({
    queryKey: ['rst-dashboard-sales', workspace.storeId, range.from, range.to],
    queryFn: () => rstAnalyticsApi.salesReport(workspace.storeId, range).then((r) => r.data),
    enabled: workspace.storeId != null,
    refetchInterval: 60_000,
  });

  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  const d = dashQuery.data;

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.dashboardTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.dashboardSubtitle')}</p>
        </div>
      </div>

      {workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={workspace.pickedStoreId}
            onChange={(e) => workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{t('rst.admin.selectStore')}</option>
            {workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {!workspace.storeId ? (
        <div className="rst-notice">{t('rst.admin.selectStore')}</div>
      ) : dashQuery.isError ? (
        <div className="rst-notice">{t('rst.admin.dashboardLoadFailed')}</div>
      ) : !d ? (
        <div className="rst-empty">{t('common.loading')}</div>
      ) : (
        <>
          <div className={`rst-dash__chip${d.shiftOpen ? ' is-open' : ''}`}>
            {d.shiftOpen
              ? t('rst.dashboard.shiftOpen', { sales: d.shiftSaleCount, revenue: fmtMoneyCompact(d.shiftRevenue) })
              : t('rst.dashboard.shiftClosed')}
          </div>
          <div className="rst-dash__grid">
            <div className="rst-dash__card"><span>{t('rst.dashboard.revenue')}</span><strong>{fmtMoneyCompact(d.revenue)}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.avgCheck')}</span><strong>{fmtMoneyCompact(d.averageCheck)}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.closedOrders')}</span><strong>{d.closedOrders}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.openOrders')}</span><strong>{d.openOrders}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.guests')}</span><strong>{d.guests}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.tables')}</span><strong>{d.occupiedTables}/{d.totalTables}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.kitchen')}</span><strong>{d.kitchenWaiting}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.reservations')}</span><strong>{d.reservationsActive}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.cash')}</span><strong>{fmtMoneyCompact(d.cashAmount)}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.card')}</span><strong>{fmtMoneyCompact(d.cardAmount)}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.cancelled')}</span><strong>{d.cancelledOrders}</strong></div>
            <div className="rst-dash__card"><span>{t('rst.dashboard.freeTables')}</span><strong>{d.freeTables}</strong></div>
          </div>

          {salesQuery.isError ? (
            <div className="rst-notice">{t('rst.admin.reportsLoadFailed')}</div>
          ) : (
            <DashboardCharts
              t={t}
              byHour={salesQuery.data?.byHour}
              byDish={salesQuery.data?.byDish}
            />
          )}
        </>
      )}
    </section>
  );
}
