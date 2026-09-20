import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import BookingFormModal from '../components/BookingFormModal';
import { useBookingAdminPage } from '../hooks/useBookingAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/booking-admin.css';

const STATUS_FILTERS = ['all', 'PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW'];

export default function BookingAdminPage() {
  const p = useBookingAdminPage();
  const locale = p.t('common.locale', { defaultValue: 'ru-RU' });

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-booking">
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
        <label className="rst-admin-field rst-admin-field--full mb-3">
          <span className="rst-admin-field__label">{p.t('rst.admin.selectStore')}</span>
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
            <div className="rst-booking__stat"><strong>{p.stats.pending}</strong><span>{p.t('rst.booking.statPending')}</span></div>
            <div className="rst-booking__stat"><strong>{p.stats.confirmed}</strong><span>{p.t('rst.booking.statConfirmed')}</span></div>
            <div className="rst-booking__stat"><strong>{p.stats.seated}</strong><span>{p.t('rst.booking.statSeated')}</span></div>
            <div className="rst-booking__stat"><strong>{p.stats.cancelled}</strong><span>{p.t('rst.booking.statCancelled')}</span></div>
          </div>

          <div className="rst-admin-filters">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('common.search')}</span>
              <BaseInput
                value={p.filters.search}
                onChange={(e) => p.setFilters({ ...p.filters, search: e.target.value })}
                placeholder={p.t('rst.booking.searchPh')}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.booking.status')}</span>
              <select
                className="form-select"
                value={p.filters.status}
                onChange={(e) => p.setFilters({ ...p.filters, status: e.target.value })}
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all'
                      ? p.t('rst.admin.filterAll')
                      : p.t(`rst.booking.status_${status}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.booking.from')}</span>
              <BaseInput
                type="date"
                value={p.filters.fromDate}
                onChange={(e) => p.setFilters({ ...p.filters, fromDate: e.target.value })}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.booking.to')}</span>
              <BaseInput
                type="date"
                value={p.filters.toDate}
                onChange={(e) => p.setFilters({ ...p.filters, toDate: e.target.value })}
              />
            </label>
            <BaseButton type="button" variant="ghost" className="rst-admin-filters__reset" onClick={p.resetFilters}>
              {p.t('rst.admin.filterReset')}
            </BaseButton>
          </div>

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
                    <th className="rst-data-table__actions">{p.t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.isLoading ? (
                    <tr>
                      <td colSpan={7} className="rst-data-table__empty">{p.t('common.loading')}</td>
                    </tr>
                  ) : p.rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="rst-data-table__empty">{p.t('rst.booking.empty')}</td>
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
