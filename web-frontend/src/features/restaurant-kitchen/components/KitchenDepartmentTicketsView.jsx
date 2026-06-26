import { ArrowLeft } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import RestaurantEmptyState from '../../restaurant-shared/components/RestaurantEmptyState';
import RestaurantPanel from '../../restaurant-shared/components/RestaurantPanel';
import KitchenTicketCard from './KitchenTicketCard';

export default function KitchenDepartmentTicketsView({
  departmentLabel,
  tickets,
  loading,
  onBack,
  onAdvance,
  isPending,
  resolveDepartmentLabel,
  t,
}) {
  return (
    <div className="kitchen-dept-tickets">
      <div className="kitchen-dept-tickets__toolbar">
        <BaseButton type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
          {t('restaurantKitchen.backToDepartments')}
        </BaseButton>
        <h2 className="kitchen-dept-tickets__title">{departmentLabel}</h2>
      </div>

      <RestaurantPanel title={t('restaurantKitchen.ticketsSection')}>
        {loading ? (
          <RestaurantEmptyState message={t('common.loading')} />
        ) : tickets.length === 0 ? (
          <RestaurantEmptyState message={t('restaurantKitchen.noTickets')} />
        ) : (
          <div className="restaurant-kitchen-page__grid">
            {tickets.map((ticket) => (
              <KitchenTicketCard
                key={ticket.id}
                ticket={ticket}
                departmentLabel={resolveDepartmentLabel(ticket.kitchenDepartment || 'GENERAL')}
                onAdvance={() => onAdvance(ticket)}
                isPending={isPending}
                t={t}
              />
            ))}
          </div>
        )}
      </RestaurantPanel>
    </div>
  );
}
