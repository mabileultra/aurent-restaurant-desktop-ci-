import { Plus, Search } from 'lucide-react';
import { BaseButton, BaseSelect, PageLayout } from '../../../components/ui';
import RestaurantNotice from '../../restaurant-shared/components/RestaurantNotice';
import '../../restaurant-shared/styles/restaurant-tokens.css';
import '../../restaurant-shared/styles/restaurant-panel.css';
import KitchenDepartmentCardsGrid from '../components/KitchenDepartmentCardsGrid';
import KitchenDepartmentFormModal from '../components/KitchenDepartmentFormModal';
import KitchenDepartmentTicketsView from '../components/KitchenDepartmentTicketsView';
import KitchenStats from '../components/KitchenStats';
import { useKitchenDepartments } from '../hooks/useKitchenDepartments';
import { useKitchenDisplayPage } from '../hooks/useKitchenDisplayPage';
import '../styles/restaurant-kitchen.css';
import '../styles/kitchen-departments.css';
import '../styles/kitchen-department-cards.css';

export default function KitchenDisplayPage() {
  const p = useKitchenDisplayPage();
  const dep = useKitchenDepartments(p.canManageDepartments);

  return (
    <PageLayout
      className="restaurant-module"
      title={p.t('restaurantKitchen.title')}
      subtitle={p.t('restaurantKitchen.subtitle')}
      actions={p.restaurantStores.length > 1 ? (
        <BaseSelect
          value={p.storeId}
          onChange={(e) => p.setStoreId(e.target.value)}
          className="min-w-[220px]"
        >
          <option value="">{p.t('restaurantKitchen.selectStore')}</option>
          {p.restaurantStores.map((store) => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </BaseSelect>
      ) : null}
    >
      {p.restaurantStores.length > 0 && p.storeId ? (
        <div className="kitchen-display space-y-5">
          <KitchenStats tickets={p.activeTickets} t={p.t} />

          {p.openedDepartment ? (
            <KitchenDepartmentTicketsView
              departmentLabel={p.resolveDepartmentLabel(p.openedDepartment)}
              tickets={p.openedTickets}
              loading={p.ticketsQuery.isLoading}
              onBack={p.closeDepartment}
              onAdvance={p.advanceStatus}
              isPending={p.statusMutation.isPending}
              resolveDepartmentLabel={p.resolveDepartmentLabel}
              t={p.t}
            />
          ) : (
            <>
              <div className="kitchen-display__toolbar">
                <div className="kitchen-departments">
                  {p.departmentTabs.map((depValue) => (
                    <button
                      key={depValue}
                      type="button"
                      className={`kitchen-departments__tab${p.tabFilter === depValue ? ' kitchen-departments__tab--active' : ''}`}
                      onClick={() => p.setTabFilter(depValue)}
                    >
                      {p.resolveDepartmentLabel(depValue)}
                    </button>
                  ))}
                </div>

                <div className="kitchen-display__toolbar-actions">
                  <label className="kitchen-display__search">
                    <Search size={16} strokeWidth={2} aria-hidden />
                    <input
                      type="search"
                      value={p.search}
                      onChange={(e) => p.setSearch(e.target.value)}
                      placeholder={p.t('restaurantKitchen.searchDepartment')}
                    />
                  </label>
                  {p.canManageDepartments ? (
                    <BaseButton type="button" size="sm" onClick={dep.openCreate}>
                      <Plus size={15} />
                      {p.t('restaurantKitchen.addDepartment')}
                    </BaseButton>
                  ) : null}
                </div>
              </div>

              <KitchenDepartmentCardsGrid
                cards={p.departmentCards}
                openedDepartment={p.openedDepartment}
                canManage={p.canManageDepartments}
                onOpenDepartment={p.openDepartment}
                onAddDepartment={dep.openCreate}
                onEditDepartment={dep.openEdit}
                t={p.t}
              />
            </>
          )}
        </div>
      ) : (
        <RestaurantNotice>{p.t('restaurantKitchen.selectStore')}</RestaurantNotice>
      )}

      <KitchenDepartmentFormModal
        open={!!dep.modal}
        mode={dep.modal?.mode}
        form={dep.modal?.form ?? {}}
        onChange={(form) => dep.setModal((prev) => (prev ? { ...prev, form } : prev))}
        onClose={() => dep.setModal(null)}
        onSubmit={() => dep.saveMutation.mutate({ id: dep.modal?.id, ...dep.modal.form })}
        isPending={dep.saveMutation.isPending}
        t={p.t}
      />
    </PageLayout>
  );
}
