import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../components/ui';
import TablePagination from '../../../../components/shared/TablePagination';
import BookingFormModal from '../../../admin/components/BookingFormModal';
import BookingFiltersBar from '../../../shared/components/BookingFiltersBar';
import { useBookingAdminPage } from '../../../admin/hooks/useBookingAdminPage';
import '../styles/waiter-mobile-booking.css';

/**
 * Phone bookings list for waiter — card rows, same mutations as admin booking workspace.
 */
export default function WaiterMobileBookingBoard({
  access = { canCreate: true, canManage: true },
}) {
  const p = useBookingAdminPage();
  const { i18n } = useTranslation();
  const locale = i18n.language || 'ru';
  const canCreate = access.canCreate !== false;
  const canManage = access.canManage !== false;

  const fmtWhen = useMemo(
    () => (iso) => (iso ? new Date(iso).toLocaleString(locale) : '—'),
    [locale],
  );

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-waiter-booking">
      <div className="rst-waiter-booking__bar">
        <strong>{p.t('rst.floor.bookingsTab')}</strong>
        {canCreate ? (
          <BaseButton type="button" size="sm" onClick={p.openCreate} disabled={!p.workspace.storeId}>
            {p.t('rst.booking.add')}
          </BaseButton>
        ) : (
          <span className="rst-waiter-booking__hint">{p.t('rst.floor.bookingViewOnly')}</span>
        )}
      </div>

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-waiter-booking__stats">
            <div><strong>{p.stats.pending}</strong><span>{p.t('rst.booking.statPending')}</span></div>
            <div><strong>{p.stats.confirmed}</strong><span>{p.t('rst.booking.statConfirmed')}</span></div>
            <div><strong>{p.stats.seated}</strong><span>{p.t('rst.booking.statSeated')}</span></div>
          </div>

          <BookingFiltersBar
            filters={p.filters}
            setFilters={p.setFilters}
            resetFilters={p.resetFilters}
            t={p.t}
            touchPickers
          />

          {p.reservationsQuery.isError ? <div className="rst-notice">{p.t('rst.booking.loadFailed')}</div> : null}

          {p.isLoading ? (
            <div className="rst-notice">{p.t('common.loading')}</div>
          ) : p.rows.length === 0 ? (
            <div className="rst-waiter-booking__empty">{p.t('rst.booking.empty')}</div>
          ) : (
            <ul className="rst-waiter-booking__list">
              {p.rows.map((row) => (
                <li key={row.id} className={`rst-waiter-booking__card rst-waiter-booking__card--${row.status}`}>
                  <div className="rst-waiter-booking__card-top">
                    <strong>{row.clientName}</strong>
                    <span className={`rst-booking__badge rst-booking__badge--${row.status}`}>
                      {p.t(`rst.booking.status_${row.status}`)}
                    </span>
                  </div>
                  <div className="rst-waiter-booking__card-meta">
                    <span>{row.hallName} / {row.tableCode}</span>
                    <span>{fmtWhen(row.reservedAt)}</span>
                    <span>{p.t('rst.order.guestsShort', { count: row.guestCount })}</span>
                    {row.clientPhone ? <span>{row.clientPhone}</span> : null}
                  </div>
                  {canManage ? (
                    <div className="rst-waiter-booking__card-actions">
                      {row.status === 'PENDING' ? (
                        <BaseButton type="button" size="sm" onClick={() => p.confirmMutation.mutate(row.id)}>
                          {p.t('rst.booking.confirm')}
                        </BaseButton>
                      ) : null}
                      {row.status === 'CONFIRMED' || row.status === 'PENDING' ? (
                        <BaseButton type="button" size="sm" onClick={() => p.seatMutation.mutate(row.id)}>
                          {p.t('rst.booking.seat')}
                        </BaseButton>
                      ) : null}
                      {row.status !== 'SEATED' && row.status !== 'CANCELLED' && row.status !== 'NO_SHOW' ? (
                        <BaseButton type="button" size="sm" variant="ghost" onClick={() => p.openEdit(row)}>
                          {p.t('common.edit')}
                        </BaseButton>
                      ) : null}
                      {row.status !== 'CANCELLED' && row.status !== 'SEATED' && row.status !== 'NO_SHOW' ? (
                        <BaseButton type="button" size="sm" variant="ghost" onClick={() => p.cancelMutation.mutate(row.id)}>
                          {p.t('rst.booking.cancel')}
                        </BaseButton>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {p.total > 0 ? (
            <TablePagination
              className="rst-waiter-booking__pager"
              page={p.page}
              pageSize={p.pageSize}
              total={p.total}
              totalPages={p.totalPages}
              pageSizeOptions={p.pageSizeOptions}
              onPageChange={p.setPage}
              onPageSizeChange={p.setPageSize}
            />
          ) : null}
        </>
      )}

      {canCreate || canManage ? (
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
      ) : null}
    </section>
  );
}
