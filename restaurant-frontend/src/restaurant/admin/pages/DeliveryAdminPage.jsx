import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import DeliveryOrderCancelModal from '../components/DeliveryOrderCancelModal';
import DeliveryOrderCreateModal from '../components/DeliveryOrderCreateModal';
import DeliveryOrderEditModal from '../components/DeliveryOrderEditModal';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { deliveryStatusLabel, NEXT_DELIVERY_STATUS, orderStatusLabel } from '../../../features/orders/utils/ordersDisplayUtils';
import { useDeliveryAdminPage } from '../hooks/useDeliveryAdminPage';
import { getApiErrorMessage } from '../../../utils/apiError';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/delivery-admin.css';

const STATUS_FILTERS = ['all', 'OPEN', 'BILLING', 'CLOSED', 'CANCELLED', 'REFUNDED'];
const DELIVERY_STATUS_FILTERS = ['all', 'NEW', 'READY', 'ON_THE_WAY', 'DELIVERED'];

function fmtDate(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale);
}

export default function DeliveryAdminPage() {
  const p = useDeliveryAdminPage();
  const locale = p.t('common.locale', { defaultValue: 'ru-RU' });
  const errorMessage = getApiErrorMessage(p.error, p.t('rst.delivery.loadFailed'));

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-delivery">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.deliveryTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.deliverySubtitle')}</p>
        </div>
        <div className="rst-halls__actions">
          <BaseButton type="button" onClick={() => p.setAddOpen(true)} disabled={!p.workspace.storeId}>
            {p.t('rst.delivery.add')}
          </BaseButton>
        </div>
      </div>

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-delivery__stats">
            <div className="rst-delivery__stat"><strong>{p.stats.total}</strong><span>{p.t('rst.delivery.statTotal')}</span></div>
            <div className="rst-delivery__stat"><strong>{p.stats.newCount}</strong><span>{p.t('rst.delivery.statNew')}</span></div>
            <div className="rst-delivery__stat"><strong>{p.stats.active}</strong><span>{p.t('rst.delivery.statActive')}</span></div>
            <div className="rst-delivery__stat"><strong>{p.stats.cancelled}</strong><span>{p.t('rst.delivery.statCancelled')}</span></div>
          </div>

          <div className="rst-admin-filters">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('common.search')}</span>
              <BaseInput
                value={p.filters.search}
                onChange={(e) => p.setFilters({ ...p.filters, search: e.target.value })}
                placeholder={p.t('rst.delivery.search')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') p.applyFilters();
                }}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.delivery.colStatus')}</span>
              <select
                className="form-select"
                value={p.filters.status}
                onChange={(e) => p.setFilters({ ...p.filters, status: e.target.value })}
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? p.t('rst.admin.filterAll') : orderStatusLabel(p.t, status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.delivery.colDeliveryStatus', { defaultValue: 'Доставка' })}</span>
              <select
                className="form-select"
                value={p.filters.deliveryStatus}
                onChange={(e) => p.setFilters({ ...p.filters, deliveryStatus: e.target.value })}
              >
                {DELIVERY_STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? p.t('rst.admin.filterAll') : deliveryStatusLabel(p.t, status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.delivery.from')}</span>
              <BaseInput
                type="date"
                value={p.filters.createdFrom}
                onChange={(e) => p.setFilters({ ...p.filters, createdFrom: e.target.value })}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.delivery.to')}</span>
              <BaseInput
                type="date"
                value={p.filters.createdTo}
                onChange={(e) => p.setFilters({ ...p.filters, createdTo: e.target.value })}
              />
            </label>
            <BaseButton type="button" onClick={p.applyFilters}>
              {p.t('common.search')}
            </BaseButton>
            <BaseButton type="button" variant="ghost" className="rst-admin-filters__reset" onClick={p.resetFilters}>
              {p.t('rst.admin.filterReset')}
            </BaseButton>
          </div>

          {p.isError ? <div className="rst-notice">{errorMessage}</div> : null}

          <div className="rst-data-card">
            <div className="rst-data-card__head">
              <strong>{p.t('rst.delivery.listTitle')}</strong>
              <span>{p.total}</span>
            </div>
            <div className="rst-data-card__table-wrap">
              <table className="rst-data-table">
                <thead>
                  <tr>
                    <th className="rst-data-table__num">#</th>
                    <th>{p.t('rst.delivery.colDate')}</th>
                    <th>{p.t('rst.delivery.colOrderNo', { defaultValue: '№' })}</th>
                    <th>{p.t('rst.delivery.colClient')}</th>
                    <th>{p.t('rst.delivery.colCourier')}</th>
                    <th>{p.t('rst.delivery.colDeliveryStatus', { defaultValue: 'Доставка' })}</th>
                    <th>{p.t('rst.delivery.colTotal')}</th>
                    <th>{p.t('rst.delivery.colStatus')}</th>
                    <th className="rst-data-table__actions">{p.t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.loading ? (
                    <tr>
                      <td colSpan={9} className="rst-data-table__empty">{p.t('common.loading')}</td>
                    </tr>
                  ) : p.rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="rst-data-table__empty">{p.t('rst.delivery.empty')}</td>
                    </tr>
                  ) : (
                    p.rows.map((row, index) => {
                      const nextDelivery = NEXT_DELIVERY_STATUS[row.deliveryStatus || 'NEW'];
                      return (
                      <tr key={row.id}>
                        <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                        <td>{fmtDate(row.openedAt, locale)}</td>
                        <td>{row.orderNo ?? '—'}</td>
                        <td className="rst-data-table__wrap">
                          <strong>{row.clientName || '—'}</strong>
                          {row.clientPhone ? (
                            <div className="rst-halls__row-meta">{row.clientPhone}</div>
                          ) : null}
                          {row.deliveryAddress ? (
                            <div className="rst-halls__row-meta">{row.deliveryAddress}</div>
                          ) : null}
                        </td>
                        <td>
                          {row.courierUserId
                            ? (p.courierNameById.get(String(row.courierUserId)) || '—')
                            : '—'}
                        </td>
                        <td>
                          <span className={`rst-delivery__status rst-delivery__status--${row.deliveryStatus || 'NEW'}`}>
                            {deliveryStatusLabel(p.t, row.deliveryStatus || 'NEW')}
                          </span>
                        </td>
                        <td>{fmtMoneyCompact(p.orderDue(row))}</td>
                        <td>
                          <span className={`rst-delivery__status rst-delivery__status--${row.status}`}>
                            {orderStatusLabel(p.t, row.status)}
                          </span>
                        </td>
                        <td className="rst-data-table__actions">
                          <div className="rst-delivery__actions">
                            {p.canAdvanceDelivery(row) && nextDelivery ? (
                              <BaseButton
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={p.advancingDelivery}
                                onClick={() => p.advanceDeliveryStatus(row, nextDelivery)}
                              >
                                {deliveryStatusLabel(p.t, nextDelivery)}
                              </BaseButton>
                            ) : null}
                            {p.canEditRow(row) ? (
                              <BaseButton type="button" size="sm" variant="ghost" onClick={() => p.openEdit(row)}>
                                {p.t('common.edit')}
                              </BaseButton>
                            ) : null}
                            {p.canCancelRow(row) ? (
                              <BaseButton type="button" size="sm" variant="ghost" onClick={() => p.setCancelOrder(row)}>
                                {p.t('common.cancel')}
                              </BaseButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      );
                    })
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

      <DeliveryOrderCreateModal
        open={p.addOpen}
        form={p.createForm}
        saving={p.creating}
        onChange={p.setCreateForm}
        onClose={p.closeAdd}
        onSubmit={p.createDelivery}
        t={p.t}
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
    </section>
  );
}
