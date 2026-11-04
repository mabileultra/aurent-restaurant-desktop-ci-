import { Link } from 'react-router-dom';
import { Bell, UserRound } from 'lucide-react';
import { DASHBOARD_PERIODS } from '../../utils/dashboardPeriod';

export default function DashboardToolbar({
  t,
  period,
  onPeriodChange,
  customFrom,
  onCustomFrom,
  customTo,
  onCustomTo,
  halls,
  hallId,
  onHallChange,
  waiters,
  waiterId,
  onWaiterChange,
  userLabel,
}) {
  return (
    <div className="rst-dash__toolbar">
      <div className="rst-dash__toolbar-brand">
        <span className="rst-dash__toolbar-kicker">{t('rst.brand')}</span>
        <h1 className="rst-dash__toolbar-title">{t('rst.admin.dashboardTitle')}</h1>
      </div>

      <div className="rst-dash__toolbar-filters">
        <label className="rst-dash__filter">
          <span>{t('rst.dashboard.filterPeriod')}</span>
          <select value={period} onChange={(e) => onPeriodChange(e.target.value)}>
            {DASHBOARD_PERIODS.map((item) => (
              <option key={item.key} value={item.key}>{t(item.labelKey)}</option>
            ))}
          </select>
        </label>

        {period === 'CUSTOM' ? (
          <>
            <label className="rst-dash__filter">
              <span>{t('rst.dashboard.customFrom')}</span>
              <input type="date" value={customFrom} onChange={(e) => onCustomFrom(e.target.value)} />
            </label>
            <label className="rst-dash__filter">
              <span>{t('rst.dashboard.customTo')}</span>
              <input type="date" value={customTo} onChange={(e) => onCustomTo(e.target.value)} />
            </label>
          </>
        ) : null}

        <label className="rst-dash__filter">
          <span>{t('rst.dashboard.filterHall')}</span>
          <select value={hallId} onChange={(e) => onHallChange(e.target.value)}>
            <option value="">{t('rst.dashboard.allHalls')}</option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>{hall.name}</option>
            ))}
          </select>
        </label>

        <label className="rst-dash__filter">
          <span>{t('rst.dashboard.filterWaiter')}</span>
          <select value={waiterId} onChange={(e) => onWaiterChange(e.target.value)}>
            <option value="">{t('rst.dashboard.allWaiters')}</option>
            {waiters.map((w) => (
              <option key={w.id} value={w.id}>{w.fullName || w.username}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rst-dash__toolbar-user">
        <Link className="rst-dash__icon-btn" to="/rst/admin/audit" title={t('rst.dashboard.alerts')}>
          <Bell size={16} strokeWidth={2} aria-hidden />
        </Link>
        <span className="rst-dash__user-chip" title={userLabel}>
          <UserRound size={14} strokeWidth={2} aria-hidden />
          {userLabel}
        </span>
      </div>
    </div>
  );
}
