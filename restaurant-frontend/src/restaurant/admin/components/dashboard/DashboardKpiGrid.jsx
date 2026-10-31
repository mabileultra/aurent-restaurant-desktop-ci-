import { Link } from 'react-router-dom';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { DASHBOARD_KPI_ICONS } from '../../config/dashboardIcons';
import { formatAbsDelta, formatPctDelta } from '../../utils/dashboardFormat';

function KpiCard({ title, value, hint, to, tone, Icon }) {
  const body = (
    <>
      <div className="rst-dash__kpi-head">
        <span className="rst-dash__kpi-title">{title}</span>
        {Icon ? (
          <span className="rst-dash__kpi-icon" aria-hidden>
            <Icon size={15} strokeWidth={2.2} />
          </span>
        ) : null}
      </div>
      <strong className="rst-dash__kpi-value">{value}</strong>
      {hint ? <span className={`rst-dash__kpi-hint${tone ? ` is-${tone}` : ''}`}>{hint}</span> : null}
    </>
  );
  if (to) {
    return <Link className="rst-dash__kpi" to={to}>{body}</Link>;
  }
  return <div className="rst-dash__kpi">{body}</div>;
}

function deltaTone(delta) {
  if (delta == null || Number(delta) === 0) return 'flat';
  return Number(delta) > 0 ? 'up' : 'down';
}

export default function DashboardKpiGrid({ t, d }) {
  if (!d) return null;

  const revHint = formatPctDelta(d.revenueDeltaPct);
  const ordersHint = formatAbsDelta(d.closedOrdersDelta);
  const avgHint = formatPctDelta(d.averageCheckDeltaPct);
  const occupied = Number(d.occupiedTables ?? 0) + Number(d.waitingPaymentTables ?? 0);
  const kitchenTotal = Number(d.kitchenWaiting ?? 0);

  return (
    <div className="rst-dash__kpi-grid">
      <KpiCard
        Icon={DASHBOARD_KPI_ICONS.sales}
        title={t('rst.dashboard.kpiSales')}
        value={fmtMoneyCompact(d.revenue)}
        hint={revHint ? `${revHint} ${t('rst.dashboard.vsPrevious')}` : t('rst.dashboard.vsPreviousNa')}
        tone={deltaTone(d.revenueDeltaPct)}
        to="/rst/admin/reports"
      />
      <KpiCard
        Icon={DASHBOARD_KPI_ICONS.orders}
        title={t('rst.dashboard.kpiOrders')}
        value={String(d.closedOrders ?? 0)}
        hint={ordersHint ? `${ordersHint} ${t('rst.dashboard.vsPrevious')}` : t('rst.dashboard.vsPreviousNa')}
        tone={deltaTone(d.closedOrdersDelta)}
        to="/rst/cashier"
      />
      <KpiCard
        Icon={DASHBOARD_KPI_ICONS.avg}
        title={t('rst.dashboard.kpiAvgCheck')}
        value={fmtMoneyCompact(d.averageCheck)}
        hint={avgHint ? `${avgHint} ${t('rst.dashboard.vsPrevious')}` : t('rst.dashboard.vsPreviousNa')}
        tone={deltaTone(d.averageCheckDeltaPct)}
        to="/rst/admin/reports"
      />
      <KpiCard
        Icon={DASHBOARD_KPI_ICONS.tables}
        title={t('rst.dashboard.kpiTables')}
        value={`${occupied} / ${d.totalTables ?? 0}`}
        hint={t('rst.dashboard.tablesHint', {
          busy: occupied,
          free: d.freeTables ?? 0,
          reserved: d.reservedTables ?? 0,
        })}
        to="/rst/cashier"
      />
      <KpiCard
        Icon={DASHBOARD_KPI_ICONS.kitchen}
        title={t('rst.dashboard.kpiKitchen')}
        value={String(kitchenTotal)}
        hint={t('rst.dashboard.kitchenHint', {
          neu: d.kitchenNew ?? 0,
          prep: d.kitchenPreparing ?? 0,
          ready: d.kitchenReady ?? 0,
        })}
        to="/rst/kitchen"
      />
      <KpiCard
        Icon={DASHBOARD_KPI_ICONS.guests}
        title={t('rst.dashboard.kpiGuests')}
        value={String(d.guests ?? 0)}
        hint={t('rst.dashboard.guestsHint', {
          cancelled: d.cancelledOrders ?? 0,
        })}
        to="/rst/admin/reports"
      />
    </div>
  );
}
