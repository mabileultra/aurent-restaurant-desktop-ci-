import { Plus } from 'lucide-react';
import { BaseButton, BaseSelect, PageLayout } from '../../../components/ui';
import RestaurantNotice from '../../restaurant-shared/components/RestaurantNotice';
import RestaurantPanel from '../../restaurant-shared/components/RestaurantPanel';
import '../../restaurant-shared/styles/restaurant-tokens.css';
import '../../restaurant-shared/styles/restaurant-panel.css';
import OrdersModals from '../../orders/components/OrdersModals';
import DeliveryOrderCancelModal from '../components/DeliveryOrderCancelModal';
import DeliveryOrderEditModal from '../components/DeliveryOrderEditModal';
import DeliveryOrdersTable from '../components/DeliveryOrdersTable';
import DeliverySearchBar from '../components/DeliverySearchBar';
import DeliveryStats from '../components/DeliveryStats';
import { useRestaurantDeliveryPage } from '../hooks/useRestaurantDeliveryPage';

export default function RestaurantDeliveryPage() {
  const p = useRestaurantDeliveryPage();
  const errorMessage = p.error?.response?.data?.message ?? p.error?.message ?? p.t('orders.loadError');

  return (
    <PageLayout
      className="restaurant-module"
      title={p.t('restaurantDelivery.title')}
      subtitle={p.t('restaurantDelivery.subtitle')}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          {p.restaurantStores.length > 1 ? (
            <BaseSelect value={p.storeId} onChange={(e) => p.setStoreId(e.target.value)} className="min-w-[220px]">
              <option value="">{p.t('restaurantDelivery.selectStore')}</option>
              {p.restaurantStores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </BaseSelect>
          ) : null}
          <BaseButton onClick={() => p.setAddOpen(true)} disabled={!p.storeId}>
            <Plus size={16} />
            {p.t('restaurantDelivery.add')}
          </BaseButton>
        </div>
      )}
    >
      {p.restaurantStores.length === 0 ? (
        <RestaurantNotice>{p.t('restaurantDelivery.noRestaurantStores')}</RestaurantNotice>
      ) : null}

      {p.storeId ? (
        <div className="space-y-5">
          <DeliveryStats rows={p.rows} total={p.total} t={p.t} />
          <DeliverySearchBar
            t={p.t}
            search={p.search}
            onSearchChange={p.setSearch}
            onSearchApply={p.applySearch}
          />
          <RestaurantPanel title={p.t('restaurantDelivery.ordersSection')} flush>
            <DeliveryOrdersTable
              t={p.t}
              rows={p.rows}
              loading={p.loading}
              isError={p.isError}
              errorMessage={errorMessage}
              page={p.page}
              pageSize={p.pageSize}
              total={p.total}
              totalPages={p.totalPages}
              onPageChange={p.setPage}
              onPageSizeChange={p.setPageSize}
              onEdit={p.openEdit}
              onCancel={p.setCancelOrder}
              canEditRow={p.canEditRow}
              canCancelRow={p.canCancelRow}
            />
          </RestaurantPanel>
        </div>
      ) : (
        <RestaurantNotice>{p.t('restaurantDelivery.selectStoreHint')}</RestaurantNotice>
      )}

      <OrdersModals
        filtersOpen={false}
        onFiltersClose={() => {}}
        filters={{}}
        onFiltersChange={() => {}}
        onFiltersApply={() => {}}
        onFiltersReset={() => {}}
        addOpen={p.addOpen}
        onAddClose={() => p.setAddOpen(false)}
        stores={p.restaurantStores}
        onOrderCreated={p.onOrderCreated}
      />

      <DeliveryOrderEditModal
        open={p.editOrderId != null}
        form={p.editForm}
        couriers={p.couriers}
        couriersLoading={p.couriersLoading}
        loading={p.editLoading}
        saving={p.savingEdit}
        onChange={p.setEditForm}
        onClose={p.closeEdit}
        onSubmit={p.saveEdit}
        t={p.t}
      />

      <DeliveryOrderCancelModal
        order={p.cancelOrder}
        isPending={p.cancelling}
        onClose={() => p.setCancelOrder(null)}
        onConfirm={p.confirmCancel}
        t={p.t}
      />
    </PageLayout>
  );
}
