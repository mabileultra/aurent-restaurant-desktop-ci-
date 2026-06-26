import { Plus } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import KitchenDepartmentCard from './KitchenDepartmentCard';

export default function KitchenDepartmentCardsGrid({
  cards,
  openedDepartment,
  canManage,
  onOpenDepartment,
  onAddDepartment,
  onEditDepartment,
  t,
}) {
  return (
    <div className="kitchen-dept-cards">
      {cards.map((card) => (
        <KitchenDepartmentCard
          key={card.department.id ?? card.department.value}
          department={card.department}
          stats={card.stats}
          unseenCount={card.unseenCount}
          isActive={openedDepartment === card.department.value}
          canManage={canManage}
          onOpen={onOpenDepartment}
          onEdit={onEditDepartment}
          t={t}
        />
      ))}

      {canManage ? (
        <button
          type="button"
          className="kitchen-dept-card kitchen-dept-card--add"
          onClick={onAddDepartment}
        >
          <span className="kitchen-dept-card__add-icon">
            <Plus size={28} strokeWidth={2} aria-hidden />
          </span>
          <span className="kitchen-dept-card__add-label">{t('restaurantKitchen.addDepartment')}</span>
        </button>
      ) : null}

      {cards.length === 0 ? (
        <div className="kitchen-dept-cards__empty">
          <p>{t('restaurantKitchen.noDepartmentsMatch')}</p>
          {canManage ? (
            <BaseButton type="button" size="sm" onClick={onAddDepartment}>
              <Plus size={15} />
              {t('restaurantKitchen.addDepartment')}
            </BaseButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
