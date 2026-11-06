import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { BaseTable } from '../../../../components/ui';
import { useClientTablePagination } from '../../hooks/shared/useClientTablePagination';
import { formatMoney } from '../../utils/shared/formatMoney';

const REVENUE_PAGE_SIZES = TABLE_PAGE_SIZE_OPTIONS.filter((n) => n <= 20);

export default function FinanceDailyRevenueTable({ t, rows, isLoading, isError }) {
  const pagination = useClientTablePagination(rows, { initialPageSize: 14 });

  return (
    <BaseTable
      className="finance-panel"
      isLoading={isLoading}
      isEmpty={!isLoading && rows.length === 0}
      emptyMessage={t('finance.incomes.revenueEmpty')}
      colSpan={7}
      footer={!isLoading && rows.length > 0 ? (
        <TablePagination
          className="finance-pagination"
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          pageSizeOptions={REVENUE_PAGE_SIZES}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      ) : null}
    >
      <table className="finance-table">
        <thead>
          <tr>
            <AdminTableNoIdHeaders />
            <th>{t('finance.common.date')}</th>
            <th>{t('finance.incomes.revenueTotal')}</th>
            <th>{t('finance.payment.cash')}</th>
            <th>{t('finance.payment.card')}</th>
            <th>{t('finance.incomes.zReportCount')}</th>
          </tr>
        </thead>
        <tbody>
          {pagination.rows.map((row, index) => (
            <tr key={`${row.date}-${row.storeId ?? 'all'}`}>
              <AdminTableNoIdCells
                page={pagination.page}
                pageSize={pagination.pageSize}
                index={index}
                id={row.id ?? row.storeId}
              />
              <td>{row.date}</td>
              <td className="finance-amount--income">{formatMoney(row.totalAmount, 'UZS')}</td>
              <td>{formatMoney(row.cashAmount, 'UZS')}</td>
              <td>{formatMoney(row.cardAmount, 'UZS')}</td>
              <td>{row.zReportCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isError ? <p className="finance-form__hint finance-form__hint--error">{t('common.loadError')}</p> : null}
    </BaseTable>
  );
}
