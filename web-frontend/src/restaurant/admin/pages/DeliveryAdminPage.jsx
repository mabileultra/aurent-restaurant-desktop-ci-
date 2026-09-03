import { BaseButton, BaseInput } from '../../../components/ui';
import OrdersModals from '../../../features/orders/components/OrdersModals';
import DeliveryOrderCancelModal from '../../../features/restaurant-delivery/components/DeliveryOrderCancelModal';
import DeliveryOrderEditModal from '../../../features/restaurant-delivery/components/DeliveryOrderEditModal';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { orderStatusLabel } from '../../../features/orders/utils/ordersDisplayUtils';
import { useDeliveryAdminPage } from '../hooks/useDeliveryAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/tech-card.css';
import '../styles/delivery-admin.css';

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function DeliveryAdminPage() {
  const p = useDeliveryAdminPage();
  const errorMessage = p.error?.response?.data?.message ?? p.error?.message ?? p.t('rst.delivery.loadFailed');

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  const rows = p.rows;
  const stats = {
    total: p.total,
    newCount: rows.filter((r) => r.status === 'NEW').length,
    active: rows.filter((r) => r.status !== 'CANCELLED' && r.status !== 'COMPLETED').length,
    cancelled: rows.filter((r) => r.status === 'CANCELLED').length,
  };

  return (
    <section>
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
          <div className="rst-delivery__stats">
            <div className="rst-delivery__stat"><strong>{stats.total}</strong><span>{p.t('rst.delivery.statTotal')}</span></div>
            <div className="rst-delivery__stat"><strong>{stats.newCount}</strong><span>{p.t('rst.delivery.statNew')}</span></div>
            <div className="rst-delivery__stat"><strong>{stats.active}</strong><span>{p.t('rst.delivery.statActive')}</span></div>
            <div className="rst-delivery__stat"><strong>{stats.cancelled}</strong><span>{p.t('rst.delivery.statCancelled')}</span></div>
          </div>

          <div className="rst-delivery__toolbar">
            <BaseInput
              className="rst-delivery__search"
              value={p.search}
              onChange={(e) => p.setSearch(e.target.value)}
              placeholder={p.t('rst.delivery.search')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') p.applySearch();
              }}
            />
            <BaseButton type="button" variant="ghost" onClick={p.applySearch}>{p.t('common.search')}</BaseButton>
          </div>

          {p.isError ? <div className="rst-notice">{errorMessage}</div> : null}

          <table className="rst-tech__table">
            <thead>
              <tr>
                <th>{p.t('rst.delivery.colDate')}</th>
                <th>{p.t('rst.delivery.colExternal')}</th>
                <th>{p.t('rst.delivery.colClient')}</th>
                <th>{p.t('rst.delivery.colCourier')}</th>
                <th>{p.t('rst.delivery.colTotal')}</th>
                <th>{p.t('rst.delivery.colStatus')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.loading ? (
                <tr><td colSpan={7}>{p.t('common.loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7}>{p.t('rst.delivery.empty')}</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  <td>{fmtDate(row.createdAt)}</td>
                  <td>{row.externalNumber || '—'}</td>
                  <td>{row.clientName || '—'}</td>
                  <td>{row.courierName || '—'}</td>
                  <td>{fmtMoneyCompact(row.totalAmount)}</td>
                  <td>
                    <span className={`rst-delivery__status rst-delivery__status--${row.status}`}>
                      {orderStatusLabel(p.t, row.status)}
                    </span>
                  </td>
                  <td>
                    <div className="rst-delivery__actions">
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
              ))}
            </tbody>
          </table>

          {p.totalPages > 1 ? (
            <div className="rst-delivery__toolbar mt-3">
              <BaseButton type="button" variant="ghost" disabled={p.page <= 0} onClick={() => p.setPage((n) => n - 1)}>
                ←
              </BaseButton>
              <span className="small text-muted">{p.page + 1} / {p.totalPages}</span>
              <BaseButton type="button" variant="ghost" disabled={p.page + 1 >= p.totalPages} onClick={() => p.setPage((n) => n + 1)}>
                →
              </BaseButton>
            </div>
          ) : null}
        </>
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
        stores={p.workspace.restaurantStores}
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
    </section>
  );
}
