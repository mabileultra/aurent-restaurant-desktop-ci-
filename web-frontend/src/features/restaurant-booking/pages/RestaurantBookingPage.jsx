import { Plus } from 'lucide-react';
import { BaseButton, BaseSelect, ErrorBanner, PageLayout } from '../../../components/ui';
import RestaurantEmptyState from '../../restaurant-shared/components/RestaurantEmptyState';
import RestaurantNotice from '../../restaurant-shared/components/RestaurantNotice';
import RestaurantPanel from '../../restaurant-shared/components/RestaurantPanel';
import '../../restaurant-shared/styles/restaurant-tokens.css';
import '../../restaurant-shared/styles/restaurant-panel.css';
import BookingCardGrid from '../components/BookingCardGrid';
import BookingFormModal from '../components/BookingFormModal';
import BookingStats from '../components/BookingStats';
import { useRestaurantBookingPage } from '../hooks/useRestaurantBookingPage';

export default function RestaurantBookingPage() {
  const p = useRestaurantBookingPage();
  const locale = p.t('common.locale', { defaultValue: 'ru-RU' });

  return (
    <PageLayout
      className="restaurant-module"
      title={p.t('restaurantBooking.title')}
      subtitle={p.t('restaurantBooking.subtitle')}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          {p.restaurantStores.length > 1 ? (
            <BaseSelect value={p.storeId} onChange={(e) => p.setStoreId(e.target.value)} className="min-w-[220px]">
              <option value="">{p.t('restaurantBooking.selectStore')}</option>
              {p.restaurantStores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </BaseSelect>
          ) : null}
          <BaseButton onClick={p.openCreate} disabled={!p.storeId}>
            <Plus size={16} />
            {p.t('restaurantBooking.add')}
          </BaseButton>
        </div>
      )}
    >
      {p.restaurantStores.length === 0 ? (
        <RestaurantNotice>{p.t('restaurantBooking.noRestaurantStores')}</RestaurantNotice>
      ) : null}

      {p.reservationsQuery.isError ? <ErrorBanner message={p.reservationsQuery.error?.response?.data?.message} /> : null}

      {p.storeId ? (
        <div className="space-y-5">
          <BookingStats reservations={p.reservations} t={p.t} />
          <RestaurantPanel title={p.t('restaurantBooking.activeSection')}>
            {p.reservationsQuery.isPending ? (
              <RestaurantEmptyState message={p.t('common.loading')} />
            ) : p.reservations.length === 0 ? (
              <RestaurantEmptyState message={p.t('restaurantBooking.empty')} />
            ) : (
              <BookingCardGrid
                reservations={p.reservations}
                locale={locale}
                t={p.t}
                onConfirm={(id) => p.confirmMutation.mutate(id)}
                onEdit={p.openEdit}
                onCancel={(id) => p.cancelMutation.mutate(id)}
                onNoShow={(id) => p.noShowMutation.mutate(id)}
              />
            )}
          </RestaurantPanel>
        </div>
      ) : (
        <RestaurantNotice>{p.t('restaurantBooking.selectStore')}</RestaurantNotice>
      )}

      <BookingFormModal
        open={!!p.modal}
        mode={p.modal?.mode}
        form={p.modal?.form ?? {}}
        tableOptions={p.tableOptions}
        tablesLoading={p.tablesQuery.isPending}
        onChange={(form) => p.setModal((prev) => (prev ? { ...prev, form } : prev))}
        onClose={() => p.setModal(null)}
        onSubmit={() => p.saveMutation.mutate({ id: p.modal?.id, ...p.modal.form })}
        isPending={p.saveMutation.isPending}
        t={p.t}
      />
    </PageLayout>
  );
}
