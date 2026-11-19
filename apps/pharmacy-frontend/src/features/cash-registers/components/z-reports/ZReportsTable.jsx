import { FileText, MoreVertical } from 'lucide-react';
import { EmptyState } from '../../../../components/ui';
import TablePagination from '../../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../../utils/formatMoney';
import { fmtCashRegisterDateTime } from '../../utils/cashRegisterDisplayUtils';
import '../../../../styles/cash-registers/z-reports-table.css';

const COL_COUNT = 12;

export default function ZReportsTable({
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
  selectAllRef,
  allPageSelected,
  toggleSelect,
  toggleSelectAllPage,
  onOpenRowMenu,
}) {
  return (
    <div className="z-reports-table-wrap ui-table-wrap">
      <div className="overflow-x-auto">
        <table className="z-reports-table ui-table">
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
              <th className="ui-th">{t('zReports.colFiscalCard')}</th>
              <th className="ui-th">{t('zReports.colDate')}</th>
              <th className="ui-th">{t('zReports.colZNumber')}</th>
              <th className="ui-th text-right">{t('zReports.colTotal')}</th>
              <th className="ui-th">{t('zReports.colPayments')}</th>
              <th className="ui-th text-right">{t('zReports.colVat')}</th>
              <th className="ui-th">{t('zReports.colStore')}</th>
              <th className="ui-th">{t('zReports.colTerminalSerial')}</th>
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
                  <EmptyState icon={FileText} title={t('zReports.empty')} />
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
                  <td className="ui-td-nowrap text-xs text-ink-muted">{row.fiscalCardId}</td>
                  <td className="ui-td-nowrap">
                    <div className="text-xs font-medium text-warning-text">
                      {t('zReports.openedPrefix')} {fmtCashRegisterDateTime(row.openedAt)}
                    </div>
                    <div className="text-xs text-ink-muted">
                      {t('zReports.closedPrefix')} {fmtCashRegisterDateTime(row.closedAt)}
                    </div>
                  </td>
                  <td className="ui-td-nowrap font-semibold">{row.zNumber}</td>
                  <td className="ui-td-nowrap text-right text-base font-bold">
                    {fmtMoney(row.totalAmount)}
                  </td>
                  <td className="z-reports-table__payments ui-td text-xs text-ink-muted">
                    <div className="space-y-0.5 whitespace-nowrap">
                      <div>{t('zReports.saleCash')}: {fmtMoney(row.cashTotal)}</div>
                      <div>{t('zReports.saleCard')}: {fmtMoney(row.cardTotal)}</div>
                      <div>{t('zReports.saleHumo')}: {fmtMoney(row.humoTotal)}</div>
                      <div>{t('zReports.saleUzcard')}: {fmtMoney(row.uzcardTotal)}</div>
                      <div>{t('zReports.saleCashless')}: {fmtMoney(row.cashlessTotal)}</div>
                    </div>
                  </td>
                  <td className="ui-td-nowrap text-right">{fmtMoney(row.vatAmount)}</td>
                  <td className="ui-td">{row.storeName}</td>
                  <td className="ui-td-nowrap text-xs text-ink-muted">{row.terminalSerial ?? '—'}</td>
                  <td className="ui-td text-right">
                    <button
                      type="button"
                      onClick={(e) => onOpenRowMenu(e, row)}
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
