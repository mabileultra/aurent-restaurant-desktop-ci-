import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BaseModal } from '../../../../components/ui';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../../components/shared/TablePagination';
import ReportExportButton from '../../../../features/reports/components/ReportExportButton';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { rstReportApi } from '../../../api/report.api';
import CashierPaidReceiptPane from '../../../pos/cashier/components/CashierPaidReceiptPane';
import { useReportDirectory } from '../../hooks/useReportDirectory';
import {
  DEBT_METHODS,
  EMPTY_RECEIPT_FILTERS,
  RECEIPT_METHODS,
  buildReceiptExportBody,
  buildReceiptFilter,
  receiptMethodLabel,
  receiptStatusLabel,
  toReceiptQueryParams,
} from '../../utils/receiptJournal';
import ReportFilterBar from './ReportFilterBar';
import '../../styles/receipt-journal.css';

const SEARCH_DEBOUNCE_MS = 350;

function formatPaidAt(iso) {
  if (!iso) return '—';
  const at = new Date(iso);
  if (!Number.isFinite(at.getTime())) return '—';
  return at.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function placeLabel(row) {
  if (row.hallName && row.tableCode) return `${row.hallName} · ${row.tableCode}`;
  return row.tableCode || row.hallName || '—';
}

export default function ReceiptJournalPanel({ storeId, storeName, fromDate, toDate, preset = 'all', t }) {
  const isDebts = preset === 'debts';
  const [filters, setFilters] = useState(EMPTY_RECEIPT_FILTERS);
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === searchDraft ? prev : { ...prev, search: searchDraft }));
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    setPage(0);
  }, [fromDate, toDate, preset]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(EMPTY_RECEIPT_FILTERS);
    setSearchDraft('');
    setPage(0);
  };

  const filter = useMemo(
    () => buildReceiptFilter({ fromDate, toDate, filters, preset }),
    [fromDate, toDate, filters, preset],
  );

  const journalQuery = useQuery({
    queryKey: ['rst-receipt-journal', storeId, filter, page, pageSize],
    queryFn: () => rstReportApi.receipts(storeId, toReceiptQueryParams(filter, page, pageSize)).then((r) => r.data),
    enabled: storeId != null,
    placeholderData: keepPreviousData,
  });

  const directory = useReportDirectory(storeId, t);
  const { nameById } = directory;
  const userName = (id) => (id ? nameById.get(String(id)) || String(id).slice(0, 8) : '—');

  const data = journalQuery.data;
  const rows = data?.rows ?? [];
  const total = data?.totalElements ?? 0;
  const totals = data?.totals;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const colSpan = 10;

  const cards = totals
    ? (isDebts
      ? [
        ['rst.reports.journal.totalChecks', totals.checkCount],
        ['rst.reports.methodCredit', fmtMoneyCompact(totals.creditAmount)],
        ['rst.reports.methodAdvance', fmtMoneyCompact(totals.advanceAmount)],
        ['rst.reports.journal.totalDebt', fmtMoneyCompact(totals.debtRemaining)],
      ]
      : [
        ['rst.reports.journal.totalChecks', totals.checkCount],
        ['rst.reports.journal.totalSales', fmtMoneyCompact(totals.totalAmount)],
        ['rst.reports.journal.totalRefunds', fmtMoneyCompact(totals.refundAmount)],
        ['rst.reports.journal.totalNet', fmtMoneyCompact(totals.netAmount)],
        ['rst.reports.journal.totalAverage', fmtMoneyCompact(totals.averageCheck)],
        ['rst.reports.journal.totalCash', fmtMoneyCompact(totals.cashAmount)],
        ['rst.reports.journal.totalCard', fmtMoneyCompact(totals.cardAmount)],
        ['rst.reports.journal.totalDiscount', fmtMoneyCompact(totals.discountAmount)],
      ])
    : [];

  return (
    <>
      <ReportFilterBar
        t={t}
        filters={filters}
        onChange={setFilter}
        onReset={resetFilters}
        directory={directory}
        fields={['method', 'status', 'waiter', 'hall', 'channel']}
        methods={isDebts ? DEBT_METHODS : RECEIPT_METHODS}
        search={{
          value: searchDraft,
          placeholder: t('rst.reports.journal.searchPh'),
          onChange: setSearchDraft,
        }}
      >
        <ReportExportButton
          fetchBlob={() => rstReportApi.exportReceipts(
            storeId,
            buildReceiptExportBody(filter, { userNameById: nameById, t }),
          )}
          filenamePrefix={isDebts ? 'rst_debts' : 'rst_receipts'}
          disabled={storeId == null || total === 0}
        />
      </ReportFilterBar>

      {journalQuery.isError ? (
        <div className="rst-notice">{t('rst.reports.journal.loadFailed')}</div>
      ) : null}

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
          <strong>{isDebts ? t('rst.reports.byDebts') : t('rst.reports.journal.title')}</strong>
          <span>{total}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table rst-journal__table">
            <thead>
              {isDebts ? (
                <tr>
                  <th>{t('rst.reports.checkNo')}</th>
                  <th>{t('rst.reports.journal.colPaidAt')}</th>
                  <th>{t('rst.reports.checkTable')}</th>
                  <th>{t('rst.reports.checkMethod')}</th>
                  <th>{t('rst.reports.debtPhone')}</th>
                  <th>{t('rst.reports.debtComment')}</th>
                  <th className="rst-journal__money">{t('rst.reports.amount')}</th>
                  <th className="rst-journal__money">{t('rst.reports.advancePaid')}</th>
                  <th className="rst-journal__money">{t('rst.reports.debtRemaining')}</th>
                  <th>{t('rst.reports.journal.colStatus')}</th>
                </tr>
              ) : (
                <tr>
                  <th>{t('rst.reports.checkNo')}</th>
                  <th>{t('rst.reports.journal.colPaidAt')}</th>
                  <th>{t('rst.reports.checkTable')}</th>
                  <th>{t('rst.reports.journal.colWaiter')}</th>
                  <th>{t('rst.reports.journal.colCashier')}</th>
                  <th>{t('rst.reports.checkMethod')}</th>
                  <th className="rst-journal__money">{t('rst.reports.amount')}</th>
                  <th className="rst-journal__money">{t('rst.reports.journal.colRefund')}</th>
                  <th className="rst-journal__money">{t('rst.reports.journal.colNet')}</th>
                  <th>{t('rst.reports.journal.colStatus')}</th>
                </tr>
              )}
            </thead>
            <tbody>
              {journalQuery.isPending ? (
                <tr><td colSpan={colSpan} className="rst-data-table__empty">{t('common.loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={colSpan} className="rst-data-table__empty">{t('rst.reports.empty')}</td></tr>
              ) : rows.map((row) => (
                <tr
                  key={row.orderId}
                  className={`rst-journal__row is-${String(row.status).toLowerCase()}`}
                  tabIndex={0}
                  onClick={() => setOpenOrderId(row.orderId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setOpenOrderId(row.orderId);
                  }}
                >
                  <td>№{row.orderNo}</td>
                  <td>{formatPaidAt(row.paidAt)}</td>
                  <td>{placeLabel(row)}</td>
                  {isDebts ? (
                    <>
                      <td>{receiptMethodLabel(row.method, t)}</td>
                      <td>{row.debtPhone || '—'}</td>
                      <td className="rst-journal__comment">{row.debtComment || '—'}</td>
                      <td className="rst-journal__money">{fmtMoneyCompact(row.totalAmount)}</td>
                      <td className="rst-journal__money">
                        {row.advancePaid != null ? fmtMoneyCompact(row.advancePaid) : '—'}
                      </td>
                      <td className="rst-journal__money">{fmtMoneyCompact(row.debtRemaining ?? row.totalAmount)}</td>
                    </>
                  ) : (
                    <>
                      <td>{userName(row.waiterUserId)}</td>
                      <td>{userName(row.cashierUserId)}</td>
                      <td>
                        {receiptMethodLabel(row.method, t)}
                        {row.cardType ? <small className="rst-journal__sub"> {row.cardType}</small> : null}
                      </td>
                      <td className="rst-journal__money">{fmtMoneyCompact(row.totalAmount)}</td>
                      <td className="rst-journal__money">
                        {Number(row.refundAmount) > 0 ? fmtMoneyCompact(row.refundAmount) : '—'}
                      </td>
                      <td className="rst-journal__money"><strong>{fmtMoneyCompact(row.netAmount)}</strong></td>
                    </>
                  )}
                  <td>
                    <span className={`rst-journal__status is-${String(row.status).toLowerCase()}`}>
                      {receiptStatusLabel(row.status, t)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </div>

      {openOrderId ? (
        <BaseModal
          open
          hideHeader
          size="sm"
          onClose={() => setOpenOrderId(null)}
          bodyClassName="rst-journal__receipt-body"
        >
          <CashierPaidReceiptPane
            orderId={openOrderId}
            storeName={storeName}
            waiterNameById={nameById}
            allowRefund={false}
            onClose={() => setOpenOrderId(null)}
            t={t}
          />
        </BaseModal>
      ) : null}
    </>
  );
}
