import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import ReportExportButton from '../../../../features/reports/components/ReportExportButton';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { rstReportApi } from '../../../api/report.api';
import { useReportDirectory } from '../../hooks/useReportDirectory';
import {
  buildReceiptFilter,
  buildShiftExportBody,
  toReceiptQueryParams,
} from '../../utils/receiptJournal';
import '../../styles/receipt-journal.css';

function fmtAt(iso) {
  if (!iso) return '—';
  const at = new Date(iso);
  if (!Number.isFinite(at.getTime())) return '—';
  return at.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function money(value) {
  return value == null ? '—' : fmtMoneyCompact(value);
}

export default function ShiftCashPanel({ storeId, fromDate, toDate, t }) {
  const directory = useReportDirectory(storeId, t);
  const filter = useMemo(() => buildReceiptFilter({ fromDate, toDate }), [fromDate, toDate]);

  const query = useQuery({
    queryKey: ['rst-shift-cash', storeId, filter],
    queryFn: () => rstReportApi.shifts(storeId, toReceiptQueryParams(filter)).then((r) => r.data),
    enabled: storeId != null,
    placeholderData: keepPreviousData,
  });

  const rows = query.data?.rows ?? [];
  const totals = query.data?.totals;
  const userName = (id) => (id ? directory.nameById.get(String(id)) || String(id).slice(0, 8) : '—');

  const cards = totals ? [
    ['rst.reports.shifts.count', totals.shiftCount],
    ['rst.reports.shifts.cashSales', fmtMoneyCompact(totals.cashSales)],
    ['rst.shift.expectedCash', fmtMoneyCompact(totals.expectedCash)],
    ['rst.reports.shifts.actual', fmtMoneyCompact(totals.closingCash)],
    ['rst.reports.shifts.difference', fmtMoneyCompact(totals.difference)],
    ['rst.reports.shifts.handoverDiff', fmtMoneyCompact(totals.handoverDiff)],
  ] : [];

  return (
    <>
      <div className="rst-admin-filters rst-journal__filters">
        <ReportExportButton
          fetchBlob={() => rstReportApi.exportShifts(
            storeId,
            buildShiftExportBody(filter, { userNameById: directory.nameById, t }),
          )}
          filenamePrefix="rst_shifts"
          disabled={storeId == null || rows.length === 0}
        />
      </div>

      {query.isError ? <div className="rst-notice">{t('rst.admin.reportsLoadFailed')}</div> : null}

      {cards.length ? (
        <div className="rst-dash__grid rst-journal__totals">
          {cards.map(([label, value]) => (
            <div key={label} className="rst-dash__card">
              <span>{t(label)}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rst-data-card">
        <div className="rst-data-card__head">
          <strong>{t('rst.reports.shifts.title')}</strong>
          <span>{rows.length}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table">
            <thead>
              <tr>
                <th>{t('rst.reports.shifts.openedAt')}</th>
                <th>{t('rst.reports.shifts.closedAt')}</th>
                <th>{t('rst.reports.journal.colCashier')}</th>
                <th className="rst-journal__money">{t('rst.shift.openingCash')}</th>
                <th className="rst-journal__money">{t('rst.reports.shifts.cashSales')}</th>
                <th className="rst-journal__money">{t('rst.shift.cashOp.typeIN')}</th>
                <th className="rst-journal__money">{t('rst.shift.cashOp.typeOUT')}</th>
                <th className="rst-journal__money">{t('rst.shift.cashOp.typeCOLLECTION')}</th>
                <th className="rst-journal__money">{t('rst.shift.expectedCash')}</th>
                <th className="rst-journal__money">{t('rst.reports.shifts.actual')}</th>
                <th className="rst-journal__money">{t('rst.reports.shifts.difference')}</th>
              </tr>
            </thead>
            <tbody>
              {query.isPending ? (
                <tr><td colSpan={11} className="rst-data-table__empty">{t('common.loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} className="rst-data-table__empty">{t('rst.reports.empty')}</td></tr>
              ) : rows.map((row) => (
                <tr key={row.shiftId} className={Number(row.difference) ? 'is-warn' : undefined}>
                  <td>{fmtAt(row.openedAt)}</td>
                  <td>{fmtAt(row.closedAt)}</td>
                  <td>{userName(row.openedByUserId)}</td>
                  <td className="rst-journal__money">{money(row.openingCash)}</td>
                  <td className="rst-journal__money">{money(row.cashSales)}</td>
                  <td className="rst-journal__money">{money(row.cashIn)}</td>
                  <td className="rst-journal__money">{money(row.cashOut)}</td>
                  <td className="rst-journal__money">{money(row.collection)}</td>
                  <td className="rst-journal__money">{money(row.expectedCash)}</td>
                  <td className="rst-journal__money">{money(row.closingCash)}</td>
                  <td className="rst-journal__money">
                    <strong>{money(row.difference)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
