import { ArrowRightLeft } from 'lucide-react';
import { EmptyState } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../utils/formatMoney';
import { fmtCashRegisterDateTime } from '../utils/cashRegisterDisplayUtils';

const COL_COUNT = 17;

export default function CashTransferTable({
  t,
  rows,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="ui-table-wrap">
      <div className="overflow-x-auto">
        <table className="ui-table admin-data-table admin-data-table--xxl">
          <thead>
            <tr className="border-b border-line bg-canvas text-center text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              <AdminTableNoIdHeaders rowSpan={2} />
              <th className="border-r border-line px-2 py-2" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupStoreRegister')}</div>
              </th>
              <th className="border-r border-line px-2 py-2" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupOpenClose')}</div>
              </th>
              <th className="border-r border-line px-2 py-2" rowSpan={2}>
                <div className="flex h-full items-center justify-center">{t('cashRegisters.transferColCashier')}</div>
              </th>
              <th className="border-r border-line px-2 py-2" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupSales')}</div>
              </th>
              <th className="border-r border-line px-2 py-2" colSpan={3}>
                <div className="leading-tight">{t('cashRegisters.transferGroupPayments')}</div>
              </th>
              <th className="border-r border-line px-2 py-2" colSpan={2}>
                <div className="leading-tight">{t('cashRegisters.transferGroupReturns')}</div>
              </th>
              <th className="px-2 py-2" colSpan={3}>
                <div className="leading-tight">{t('cashRegisters.transferGroupReturnMethods')}</div>
              </th>
            </tr>
            <tr className="border-b border-line bg-canvas text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              <th className="border-r border-line px-2 py-2 whitespace-nowrap">{t('cashRegisters.transferColStore')}</th>
              <th className="border-r border-line px-2 py-2 whitespace-nowrap">{t('cashRegisters.transferColRegister')}</th>
              <th className="border-r border-line px-2 py-2 whitespace-nowrap">{t('cashRegisters.transferColOpened')}</th>
              <th className="border-r border-line px-2 py-2 whitespace-nowrap">{t('cashRegisters.transferColClosed')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColSaleQty')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColSaleTotal')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColPayCash')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColPayCard')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColPayNonCash')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColRetQty')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColRetTotal')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColRetCash')}</th>
              <th className="border-r border-line px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColRetCard')}</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">{t('cashRegisters.transferColRetNonCash')}</th>
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
                  <EmptyState icon={ArrowRightLeft} title={t('cashRegisters.transferEmptyBanner')} />
                </td>
              </tr>
            ) : (
              rows.map((r, index) => (
                <tr key={r.zReportId} className="ui-tr">
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={r.zReportId} />
                  <td className="max-w-[180px] truncate border-r border-line px-2 py-2" title={r.storeName}>
                    {r.storeName}
                  </td>
                  <td className="border-r border-line px-2 py-2 whitespace-nowrap">
                    {r.registerNumber != null ? r.registerNumber : '—'}
                  </td>
                  <td className="whitespace-nowrap border-r border-line px-2 py-2 text-ink-muted">
                    {fmtCashRegisterDateTime(r.openedAt)}
                  </td>
                  <td className="whitespace-nowrap border-r border-line px-2 py-2 text-ink-muted">
                    {fmtCashRegisterDateTime(r.closedAt)}
                  </td>
                  <td className="border-r border-line px-2 py-2">
                    {r.cashierName}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {r.salesCount}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right font-semibold whitespace-nowrap">
                    {fmtMoney(r.totalAmount)}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {fmtMoney(r.paymentCash)}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {fmtMoney(r.paymentCard)}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {fmtMoney(r.paymentNonCash)}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {r.returnsCount}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {fmtMoney(r.returnsTotalAmount)}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {fmtMoney(r.returnsCash)}
                  </td>
                  <td className="border-r border-line px-2 py-2 text-right whitespace-nowrap">
                    {fmtMoney(r.returnsCard)}
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    {fmtMoney(r.returnsNonCash)}
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
