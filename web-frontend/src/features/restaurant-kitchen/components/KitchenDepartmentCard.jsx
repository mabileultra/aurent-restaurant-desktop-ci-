import { MoreVertical } from 'lucide-react';
import { resolveDepartmentMeta } from '../utils/kitchenDepartmentMeta';

export default function KitchenDepartmentCard({
  department,
  stats,
  unseenCount,
  isActive,
  canManage,
  onOpen,
  onEdit,
  t,
}) {
  const meta = resolveDepartmentMeta(department.value);
  const Icon = meta.icon;
  const hasOrders = stats.total > 0;
  const hasUnseen = unseenCount > 0;

  return (
    <article
      className={`kitchen-dept-card kitchen-dept-card--${meta.tone}${hasUnseen ? ' kitchen-dept-card--unseen' : ''}${isActive ? ' kitchen-dept-card--active' : ''}`}
    >
      <button
        type="button"
        className="kitchen-dept-card__open"
        onClick={() => onOpen(department.value)}
      >
        <header className="kitchen-dept-card__head">
          <div className={`kitchen-dept-card__icon kitchen-dept-card__icon--${meta.tone}`}>
            <Icon size={22} strokeWidth={2} aria-hidden />
          </div>
          <div className="kitchen-dept-card__title-wrap">
            <h3 className="kitchen-dept-card__title">{department.label}</h3>
            <span className="kitchen-dept-card__code">{department.value}</span>
          </div>
          {hasUnseen ? (
            <span className="kitchen-dept-card__badge" title={t('restaurantKitchen.newOrdersBadge')}>
              {unseenCount}
            </span>
          ) : null}
        </header>

        <div className="kitchen-dept-card__count">
          <span className="kitchen-dept-card__count-value">{stats.total}</span>
          <span className="kitchen-dept-card__count-label">{t('restaurantKitchen.ordersCount')}</span>
        </div>

        <ul className="kitchen-dept-card__breakdown">
          <li>
            <span>{t('restaurantKitchen.statPending')}</span>
            <strong className={stats.pending > 0 ? 'kitchen-dept-card__metric--pending' : ''}>{stats.pending}</strong>
          </li>
          <li>
            <span>{t('restaurantKitchen.statInProgress')}</span>
            <strong className={stats.inProgress > 0 ? 'kitchen-dept-card__metric--progress' : ''}>{stats.inProgress}</strong>
          </li>
          <li>
            <span>{t('restaurantKitchen.statReady')}</span>
            <strong className={stats.ready > 0 ? 'kitchen-dept-card__metric--ready' : ''}>{stats.ready}</strong>
          </li>
        </ul>

        <footer className="kitchen-dept-card__foot">
          <span className={`kitchen-dept-card__status${hasOrders ? ' kitchen-dept-card__status--busy' : ''}`}>
            {hasOrders ? t('restaurantKitchen.departmentBusy') : t('restaurantKitchen.departmentActive')}
          </span>
        </footer>
      </button>

      {canManage ? (
        <div className="kitchen-dept-card__menu">
          <button
            type="button"
            className="kitchen-dept-card__menu-btn"
            title={t('common.edit')}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(department);
            }}
          >
            <MoreVertical size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : null}
    </article>
  );
}
