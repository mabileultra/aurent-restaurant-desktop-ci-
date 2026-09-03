import { BaseButton } from '../../../components/ui';
import BookingCard from '../components/BookingCard';
import BookingFormModal from '../components/BookingFormModal';
import { useBookingAdminPage } from '../hooks/useBookingAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/booking-admin.css';

export default function BookingAdminPage() {
  const p = useBookingAdminPage();
  const locale = p.t('common.locale', { defaultValue: 'ru-RU' });

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  const stats = {
    pending: p.reservations.filter((r) => r.status === 'PENDING').length,
    confirmed: p.reservations.filter((r) => r.status === 'CONFIRMED').length,
    seated: p.reservations.filter((r) => r.status === 'SEATED').length,
    cancelled: p.reservations.filter((r) => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length,
  };

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.bookingTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.bookingSubtitle')}</p>
        </div>
        <div className="rst-halls__actions">
          <BaseButton type="button" onClick={p.openCreate} disabled={!p.workspace.storeId}>
            {p.t('rst.booking.add')}
          </BaseButton>
        </div>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={p.workspace.pickedStoreId}
            onChange={(e) => p.workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{p.t('rst.admin.selectStore')}</option>
            {p.workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-booking__stats">
            <div className="rst-booking__stat"><strong>{stats.pending}</strong><span>{p.t('rst.booking.statPending')}</span></div>
            <div className="rst-booking__stat"><strong>{stats.confirmed}</strong><span>{p.t('rst.booking.statConfirmed')}</span></div>
            <div className="rst-booking__stat"><strong>{stats.seated}</strong><span>{p.t('rst.booking.statSeated')}</span></div>
            <div className="rst-booking__stat"><strong>{stats.cancelled}</strong><span>{p.t('rst.booking.statCancelled')}</span></div>
          </div>

          {p.reservationsQuery.isError ? <div className="rst-notice">{p.t('rst.booking.loadFailed')}</div> : null}

          {p.reservationsQuery.isPending ? (
            <div className="rst-empty">{p.t('common.loading')}</div>
          ) : p.reservations.length === 0 ? (
            <div className="rst-empty">{p.t('rst.booking.empty')}</div>
          ) : (
            <div className="rst-booking__grid">
              {p.reservations.map((row) => (
                <BookingCard
                  key={row.id}
                  row={row}
                  locale={locale}
                  t={p.t}
                  onConfirm={(id) => p.confirmMutation.mutate(id)}
                  onSeat={(id) => p.seatMutation.mutate(id)}
                  onEdit={p.openEdit}
                  onCancel={(id) => p.cancelMutation.mutate(id)}
                  onNoShow={(id) => p.noShowMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </>
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
    </section>
  );
}
