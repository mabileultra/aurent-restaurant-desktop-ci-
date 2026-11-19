import { MoreVertical, Receipt } from 'lucide-react';
import { EmptyState } from '../../../../components/ui';
import TablePagination from '../../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../../utils/formatMoney';
import CreditAdvanceCell from './CreditAdvanceCell';
import PaymentIcon from './PaymentIcon';
import ShiftCell from './ShiftCell';

const COL_COUNT = 13;

export default function SalesLedgerTable({
  t,
  rows,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  toggleSelect,
  allPageSelected,
  selectAllRef,
  toggleSelectAllPage,
  fmtAt,
  paymentIconMethod,
  paymentLabel,
  onOpenRowMenu,
}) {
  return (
    <div className="ui-table-wrap">
      <div className="overflow-x-auto">
        <table className="ui-table admin-data-table admin-data-table--xl">
          <thead>
            <tr>
              <th className="ui-th w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAllPage}
                  className="rounded border-line-strong accent-primary-500"
                />
              </th>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('salesLedger.colDateReceipt')}</th>
              <th className="ui-th">{t('salesLedger.colStore')}</th>
              <th className="ui-th">{t('salesLedger.colEmployee')}</th>
              <th className="ui-th">{t('salesLedger.colShift')}</th>
              <th className="ui-th text-right">{t('salesLedger.colTotal')}</th>
              <th className="ui-th text-right">{t('salesLedger.colCreditAdvance')}</th>
              <th className="ui-th">{t('salesLedger.colPayment')}</th>
              <th className="ui-th text-right">{t('salesLedger.colGrandTotal')}</th>
              <th className="ui-th text-right">{t('salesLedger.colReturns')}</th>
              <th className="ui-th w-12" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="ui-td py-10 text-center text-ink-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="p-0">
                  <EmptyState icon={Receipt} title={t('salesLedger.empty')} />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className="ui-tr">
                  <td className="ui-td">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded border-line-strong accent-primary-500"
                    />
                  </td>
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                  <td className="ui-td-nowrap">
                    <div>{fmtAt(row.createdAt)}</div>
                    <div className="text-xs text-ink-muted">/ {row.receiptNumber}</div>
                  </td>
                  <td className="ui-td">{row.storeName ?? '—'}</td>
                  <td className="ui-td">{row.cashierName ?? '—'}</td>
                  <td className="ui-td">
                    <ShiftCell row={row} t={t} fmtAt={fmtAt} />
                  </td>
                  <td className="ui-td-nowrap text-right font-medium">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="ui-td text-right">
                    <CreditAdvanceCell row={row} t={t} />
                  </td>
                  <td className="ui-td-nowrap">
                    <div className="flex items-center gap-2 text-ink">
                      <PaymentIcon method={paymentIconMethod(row)} />
                      <span className="text-xs font-medium">{paymentLabel(row)}</span>
                      {row.receiptType !== 'CREDIT' && row.receiptType !== 'ADVANCE' ? (
                        <span className="text-xs text-ink-muted">{fmtMoney(row.amountTendered)}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="ui-td-nowrap text-right font-semibold">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="ui-td-nowrap text-right">
                    {Number(row.returnAmount) > 0 ||
                    row.status === 'VOIDED' ||
                    row.status === 'REFUNDED' ? (
                      <span className="ui-badge-danger">
                        {fmtMoney(row.returnAmount ?? row.totalAmount)}
                      </span>
                    ) : (
                      <span className="text-ink-disabled">—</span>
                    )}
                  </td>
                  <td className="ui-td text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRowMenu(row, e.currentTarget.getBoundingClientRect());
                      }}
                      className="ui-btn-icon h-8 w-8"
                    >
                      <MoreVertical size={16} strokeWidth={1.75} />
                    </button>
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
      />
    </div>
  );
}
