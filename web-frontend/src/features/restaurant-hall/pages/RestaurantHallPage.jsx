import { Plus } from 'lucide-react';
import { BaseButton, BaseSelect, ErrorBanner, PageLayout } from '../../../components/ui';
import RestaurantNotice from '../../restaurant-shared/components/RestaurantNotice';
import RestaurantPanel from '../../restaurant-shared/components/RestaurantPanel';
import '../../restaurant-shared/styles/restaurant-tokens.css';
import '../../restaurant-shared/styles/restaurant-panel.css';
import HallFormModal from '../components/HallFormModal';
import HallStats from '../components/HallStats';
import HallSummary from '../components/HallSummary';
import HallTableGrid from '../components/HallTableGrid';
import HallTableList from '../components/HallTableList';
import HallTabs from '../components/HallTabs';
import TableFormModal from '../components/TableFormModal';
import { useRestaurantHallPage } from '../hooks/useRestaurantHallPage';

export default function RestaurantHallPage() {
  const p = useRestaurantHallPage();
  const tables = p.selectedHall?.tables ?? [];

  return (
    <PageLayout
      className="restaurant-module"
      title={p.t('restaurantHall.title')}
      subtitle={p.t('restaurantHall.subtitle')}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          {p.restaurantStores.length > 1 ? (
            <BaseSelect
              value={p.storeId}
              onChange={(e) => p.setStoreId(e.target.value)}
              className="min-w-[220px]"
            >
              <option value="">{p.t('restaurantHall.selectStore')}</option>
              {p.restaurantStores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </BaseSelect>
          ) : null}
          <BaseButton variant="secondary" onClick={p.openCreateHall} disabled={!p.storeId}>
            <Plus size={16} />
            {p.t('restaurantHall.addHall')}
          </BaseButton>
          <BaseButton onClick={p.openCreateTable} disabled={!p.selectedHall}>
            <Plus size={16} />
            {p.t('restaurantHall.addTable')}
          </BaseButton>
        </div>
      )}
    >
      {p.restaurantStores.length === 0 ? (
        <RestaurantNotice>{p.t('restaurantHall.noRestaurantStores')}</RestaurantNotice>
      ) : null}

      {p.floorQuery.isError ? <ErrorBanner message={p.floorQuery.error?.response?.data?.message} /> : null}

      {p.storeId ? (
        <div className="space-y-5">
          <HallTabs
            halls={p.halls}
            selectedHallId={p.selectedHall?.id ?? null}
            onSelectHall={p.setSelectedHallId}
            onEditHall={() => p.openEditHall(p.selectedHall)}
            onDeleteHall={() => {
              if (window.confirm(p.t('restaurantHall.confirmDeactivateHall'))) {
                p.deactivateHallMutation.mutate(p.selectedHall.id);
              }
            }}
          />

          {p.selectedHall ? (
            <>
              <HallSummary
                hallName={p.selectedHall.name}
                tableCount={tables.length}
                t={p.t}
              />
              <HallStats tables={tables} t={p.t} />
              <RestaurantPanel title={p.t('restaurantHall.tablesSection')}>
                <HallTableGrid
                  tables={tables}
                  onTableClick={p.openEditTable}
                  onAddTable={p.openCreateTable}
                  t={p.t}
                />
              </RestaurantPanel>
              <RestaurantPanel title={p.t('restaurantHall.tableListSection')} flush>
                <HallTableList
                  tables={tables}
                  onEditTable={p.openEditTable}
                  onDeleteTable={(table) => {
                    if (window.confirm(p.t('restaurantHall.confirmDeactivateTable'))) {
                      p.deactivateTableMutation.mutate(table.id);
                    }
                  }}
                  t={p.t}
                />
              </RestaurantPanel>
            </>
          ) : (
            <RestaurantNotice>{p.t('restaurantHall.selectHall')}</RestaurantNotice>
          )}
        </div>
      ) : null}

      <HallFormModal
        open={!!p.hallModal}
        mode={p.hallModal?.mode}
        form={p.hallModal?.form ?? { name: '', sortOrder: 100 }}
        onChange={(form) => p.setHallModal((prev) => (prev ? { ...prev, form } : prev))}
        onClose={() => p.setHallModal(null)}
        onSubmit={() => p.saveHallMutation.mutate({ id: p.hallModal?.id, ...p.hallModal.form })}
        isPending={p.saveHallMutation.isPending}
        t={p.t}
      />

      <TableFormModal
        open={!!p.tableModal}
        mode={p.tableModal?.mode}
        form={p.tableModal?.form ?? {}}
        onChange={(form) => p.setTableModal((prev) => (prev ? { ...prev, form } : prev))}
        onClose={() => p.setTableModal(null)}
        onSubmit={() => p.saveTableMutation.mutate({ id: p.tableModal?.id, ...p.tableModal.form })}
        isPending={p.saveTableMutation.isPending}
        t={p.t}
      />
    </PageLayout>
  );
}
