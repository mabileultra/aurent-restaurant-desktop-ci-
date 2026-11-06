import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { rstCommissionApi } from '../../../api/commission.api';

export default function WaiterCommissionOrdersTable({ storeId, waiterUserId, params, t }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const ordersQuery = useQuery({
    queryKey: ['rst-waiter-commission-orders', storeId, waiterUserId, params, page, pageSize],
    queryFn: () => rstCommissionApi.waiterOrders(storeId, waiterUserId, {
      ...params,
      page,
      size: pageSize,
    }).then((r) => r.data),
    enabled: storeId != null && Boolean(waiterUserId),
    placeholderData: keepPreviousData,
  });

  const rows = ordersQuery.data?.content ?? [];
  const total = ordersQuery.data?.totalElements ?? 0;
  const totalPages = Math.max(
    1,
    ordersQuery.data?.totalPages || Math.ceil(total / pageSize) || 1,
  );

  return (
    <>
      <table className="rst-data-table rst-data-table--nested">
        <thead>
          <tr>
            <th>{t('rst.commission.orderNo')}</th>
            <th>{t('rst.commission.table')}</th>
            <th>{t('rst.commission.closedAt')}</th>
            <th>{t('rst.commission.sales')}</th>
            <th>%</th>
            <th>{t('rst.commission.total')}</th>
          </tr>
        </thead>
        <tbody>
          {ordersQuery.isPending && !rows.length ? (
            <tr>
              <td colSpan={6} className="rst-data-table__empty">{t('common.loading')}</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="rst-data-table__empty">{t('rst.commission.empty')}</td>
            </tr>
          ) : rows.map((order) => (
            <tr key={order.orderId}>
              <td>#{order.orderNo}</td>
              <td>{order.tableCode || '—'}</td>
              <td>
                {order.closedAt
                  ? new Date(order.closedAt).toLocaleString()
                  : '—'}
              </td>
              <td>{fmtMoneyCompact(order.subtotal)}</td>
              <td>{Number(order.commissionPercent ?? 0)}%</td>
              <td>{fmtMoneyCompact(order.commissionAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {total > 0 ? (
        <TablePagination
          className="rst-data-card__pagination"
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
        />
      ) : null}
    </>
  );
}
