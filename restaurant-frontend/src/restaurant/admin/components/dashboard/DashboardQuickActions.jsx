import { Link } from 'react-router-dom';
import { DASHBOARD_ACTION_ICONS } from '../../config/dashboardIcons';

export default function DashboardQuickActions({ t, actions }) {
  if (!actions?.length) return null;
  return (
    <div className="rst-dash__actions">
      {actions.map((action) => {
        const Icon = DASHBOARD_ACTION_ICONS[action.key];
        return (
          <Link key={action.key} className="rst-dash__action" to={action.to}>
            {Icon ? <Icon size={15} strokeWidth={2.2} aria-hidden /> : null}
            {t(`rst.dashboard.action.${action.key}`)}
          </Link>
        );
      })}
    </div>
  );
}
