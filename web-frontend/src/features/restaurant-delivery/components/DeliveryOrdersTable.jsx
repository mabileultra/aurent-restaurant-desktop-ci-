import { Pencil, Trash2 } from 'lucide-react';
import TablePagination from '../../../components/shared/TablePagination';
import { BaseButton } from '../../../components/ui';
import { fmtMoney } from '../../../utils/formatMoney';
import { fmtOrderDateTime, orderStatusLabel } from '../../orders/utils/ordersDisplayUtils';
import '../../restaurant-shared/styles/restaurant-panel.css';
import '../styles/delivery-orders-table.css';

export default function DeliveryOrdersTable({
  t,
  rows,
  loading,
  isError,
  errorMessage,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onCancel,
  canEditRow,
  canCancelRow,
}) {
  return (
    <div className="delivery-orders-table">
      <div className="delivery-orders-table__scroll">
        <table className="restaurant-data-table">
          <thead>
            <tr>
              <th>{t('orders.colOrderDate')}</th>
              <th>{t('orders.colExternal')}</th>
              <th>{t('orders.colClient')}</th>
              <th>{t('orders.colCourier')}</th>
              <th className="delivery-orders-table__right">{t('orders.colTotal')}</th>
              <th>{t('orders.colStatus')}</th>
              <th className="delivery-orders-table__actions-col">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="delivery-orders-table__empty">{t('common.loading')}</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="delivery-orders-table__error">{errorMessage}</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="delivery-orders-table__empty">{t('restaurantDelivery.empty')}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{fmtOrderDateTime(row.createdAt)}</td>
                  <td>{row.externalNumber || '—'}</td>
                  <td>
                    <div className="delivery-orders-table__client">{row.clientName || '—'}</div>
                  </td>
                  <td>{row.courierName || '—'}</td>
                  <td className="delivery-orders-table__right">{fmtMoney(row.totalAmount)}</td>
                  <td>
                    <span className={`delivery-orders-table__status delivery-orders-table__status--${row.status}`}>
                      {orderStatusLabel(t, row.status)}
                    </span>
                  </td>
                  <td>
                    <div className="delivery-orders-table__actions">
                      {canEditRow?.(row) ? (
                        <BaseButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(row)}
                          title={t('common.edit')}
                        >
                          <Pencil size={15} />
                        </BaseButton>
                      ) : null}
                      {canCancelRow?.(row) ? (
                        <BaseButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel?.(row)}
                          title={t('restaurantDelivery.cancelOrder')}
                        >
                          <Trash2 size={15} />
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
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        t={t}
      />
    </div>
  );
}
