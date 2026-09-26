import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import BookingFormModal from '../../admin/components/BookingFormModal';
import BookingFiltersBar from './BookingFiltersBar';
import { useBookingAdminPage } from '../../admin/hooks/useBookingAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../../admin/styles/halls-admin.css';
import '../../admin/styles/stations-admin.css';
import '../../admin/styles/booking-admin.css';

/**
 * Shared bookings workspace — admin page + POS «Зал → Бронирования».
 * access: { canCreate, canManage } from floorRoleAccess.
 */
export default function BookingWorkspace({
  access = { canCreate: true, canManage: true },
  compact = false,
}) {
  const p = useBookingAdminPage();
  const { i18n } = useTranslation();
  const locale = i18n.language || 'ru';
  const canCreate = access.canCreate !== false;
  const canManage = access.canManage !== false;

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className={`rst-booking${compact ? ' rst-booking--compact' : ''}`}>
      {!compact ? (
        <div className="rst-halls__toolbar">
          <div>
            <h1 className="rst-coming__title">{p.t('rst.admin.bookingTitle')}</h1>
            <p className="rst-coming__text mb-0">{p.t('rst.admin.bookingSubtitle')}</p>
          </div>
          <div className="rst-halls__actions">
            {canCreate ? (
              <BaseButton type="button" onClick={p.openCreate} disabled={!p.workspace.storeId}>
                {p.t('rst.booking.add')}
              </BaseButton>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rst-booking__compact-bar">
          <strong>{p.t('rst.floor.bookingsTab')}</strong>
          {canCreate ? (
            <BaseButton type="button" size="sm" onClick={p.openCreate} disabled={!p.workspace.storeId}>
              {p.t('rst.booking.add')}
            </BaseButton>
          ) : (
            <span className="rst-booking__view-only">{p.t('rst.floor.bookingViewOnly')}</span>
          )}
        </div>
      )}

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-booking__stats">
            <div className="rst-booking__stat"><strong>{p.stats.pending}</strong><span>{p.t('rst.booking.statPending')}</span></div>
            <div className="rst-booking__stat"><strong>{p.stats.confirmed}</strong><span>{p.t('rst.booking.statConfirmed')}</span></div>
            <div className="rst-booking__stat"><strong>{p.stats.seated}</strong><span>{p.t('rst.booking.statSeated')}</span></div>
            <div className="rst-booking__stat"><strong>{p.stats.cancelled}</strong><span>{p.t('rst.booking.statCancelled')}</span></div>
          </div>

          <BookingFiltersBar
            filters={p.filters}
            setFilters={p.setFilters}
            resetFilters={p.resetFilters}
            t={p.t}
            touchPickers={compact}
          />

          {p.reservationsQuery.isError ? <div className="rst-notice">{p.t('rst.booking.loadFailed')}</div> : null}

          <div className="rst-data-card">
            <div className="rst-data-card__head">
              <strong>{p.t('rst.booking.listTitle')}</strong>
              <span>{p.total}</span>
            </div>
            <div className="rst-data-card__table-wrap">
              <table className="rst-data-table">
                <thead>
                  <tr>
                    <th className="rst-data-table__num">#</th>
                    <th>{p.t('rst.booking.clientName')}</th>
                    <th>{p.t('rst.booking.table')}</th>
                    <th>{p.t('rst.booking.reservedAt')}</th>
                    <th>{p.t('rst.booking.guestCount')}</th>
                    <th>{p.t('rst.booking.status')}</th>
                    {canManage ? <th className="rst-data-table__actions">{p.t('common.actions')}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {p.isLoading ? (
                    <tr>
                      <td colSpan={canManage ? 7 : 6} className="rst-data-table__empty">{p.t('common.loading')}</td>
                    </tr>
                  ) : p.rows.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 7 : 6} className="rst-data-table__empty">{p.t('rst.booking.empty')}</td>
                    </tr>
                  ) : (
                    p.rows.map((row, index) => (
                      <tr key={row.id}>
                        <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                        <td className="rst-data-table__wrap">
                          <strong>{row.clientName}</strong>
                          {row.clientPhone ? (
                            <div className="rst-halls__row-meta">{row.clientPhone}</div>
                          ) : null}
                        </td>
                        <td>{row.hallName} / {row.tableCode}</td>
                        <td>
                          {row.reservedAt ? new Date(row.reservedAt).toLocaleString(locale) : '—'}
                          <div className="rst-halls__row-meta">
                            {row.durationMinutes} {p.t('rst.booking.minutesShort')}
                          </div>
                        </td>
                        <td>{row.guestCount}</td>
                        <td>
                          <span className={`rst-booking__badge rst-booking__badge--${row.status}`}>
                            {p.t(`rst.booking.status_${row.status}`)}
                          </span>
                        </td>
                        {canManage ? (
                          <td className="rst-data-table__actions">
                            <div className="rst-booking__row-actions">
                              {row.status === 'PENDING' ? (
                                <BaseButton type="button" size="sm" onClick={() => p.confirmMutation.mutate(row.id)}>
                                  {p.t('rst.booking.confirm')}
                                </BaseButton>
                              ) : null}
                              {row.status === 'CONFIRMED' || row.status === 'PENDING' ? (
                                <BaseButton type="button" size="sm" variant="ghost" onClick={() => p.seatMutation.mutate(row.id)}>
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
                              {row.status === 'CONFIRMED' ? (
                                <BaseButton type="button" size="sm" variant="ghost" onClick={() => p.noShowMutation.mutate(row.id)}>
                                  {p.t('rst.booking.noShow')}
                                </BaseButton>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {p.total > 0 ? (
              <TablePagination
                className="rst-data-card__pagination"
                page={p.page}
                pageSize={p.pageSize}
                total={p.total}
                totalPages={p.totalPages}
                pageSizeOptions={p.pageSizeOptions}
                onPageChange={p.setPage}
                onPageSizeChange={p.setPageSize}
              />
            ) : null}
          </div>
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
