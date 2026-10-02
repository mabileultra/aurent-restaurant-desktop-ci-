import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { rstReportApi } from '../../../api/report.api';
import { useReportDirectory } from '../../hooks/useReportDirectory';
import {
  EMPTY_RECEIPT_FILTERS,
  breakdownLabel,
  buildReceiptFilter,
  toReceiptQueryParams,
} from '../../utils/receiptJournal';
import ReportFilterBar from './ReportFilterBar';
import '../../styles/receipt-journal.css';

function BreakdownCard({ title, rows, group, t }) {
  const max = Math.max(0, ...rows.map((row) => Number(row.amount) || 0));
  const sum = rows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  return (
    <div className="rst-data-card rst-summary__card">
      <div className="rst-data-card__head">
        <strong>{title}</strong>
        <span>{fmtMoneyCompact(sum)}</span>
      </div>
      {rows.length === 0 ? (
        <p className="rst-summary__empty">{t('rst.reports.empty')}</p>
      ) : (
        <ul className="rst-summary__list">
          {rows.map((row) => {
            const amount = Number(row.amount) || 0;
            const share = sum > 0 ? Math.round((amount / sum) * 1000) / 10 : 0;
            return (
              <li key={row.key ?? '—'} className="rst-summary__item">
                <div className="rst-summary__line">
                  <span className="rst-summary__label">{breakdownLabel(group, row.key, t)}</span>
                  <span className="rst-summary__count">{row.count}</span>
                  <strong className="rst-journal__money">{fmtMoneyCompact(amount)}</strong>
                  <span className="rst-summary__share">{share}%</span>
                </div>
                <div className="rst-summary__bar" aria-hidden>
                  <span style={{ width: `${max > 0 ? (amount / max) * 100 : 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SalesSummaryPanel({ storeId, fromDate, toDate, t }) {
  const [filters, setFilters] = useState(EMPTY_RECEIPT_FILTERS);
  const directory = useReportDirectory(storeId, t);

  const filter = useMemo(() => buildReceiptFilter({ fromDate, toDate, filters }), [fromDate, toDate, filters]);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const summaryQuery = useQuery({
    queryKey: ['rst-sales-summary', storeId, filter, timeZone],
    queryFn: () => rstReportApi.salesSummary(storeId, { ...toReceiptQueryParams(filter), timeZone })
      .then((r) => r.data),
    enabled: storeId != null,
    placeholderData: keepPreviousData,
  });

  const data = summaryQuery.data;
  const totals = data?.totals;
  const cards = totals ? [
    ['rst.reports.journal.totalSales', fmtMoneyCompact(totals.totalAmount)],
    ['rst.reports.journal.totalRefunds', fmtMoneyCompact(totals.refundAmount)],
    ['rst.reports.journal.totalNet', fmtMoneyCompact(totals.netAmount)],
    ['rst.reports.journal.totalChecks', totals.checkCount],
    ['rst.reports.journal.totalAverage', fmtMoneyCompact(totals.averageCheck)],
    ['rst.reports.journal.totalGuests', totals.guestCount],
    ['rst.reports.journal.totalDiscount', fmtMoneyCompact(totals.discountAmount)],
    ['rst.reports.journal.colService', fmtMoneyCompact(totals.serviceAmount)],
    ['rst.reports.journal.totalCash', fmtMoneyCompact(totals.cashAmount)],
    ['rst.reports.journal.totalCard', fmtMoneyCompact(totals.cardAmount)],
    ['rst.reports.methodCredit', fmtMoneyCompact(totals.creditAmount)],
    ['rst.reports.journal.totalDebt', fmtMoneyCompact(totals.debtRemaining)],
  ] : [];

  return (
    <>
      <ReportFilterBar
        t={t}
        filters={filters}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onReset={() => setFilters(EMPTY_RECEIPT_FILTERS)}
        directory={directory}
      />

      {summaryQuery.isError ? <div className="rst-notice">{t('rst.admin.reportsLoadFailed')}</div> : null}
      {summaryQuery.isPending ? <div className="rst-notice">{t('common.loading')}</div> : null}

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

      {data ? (
        <div className="rst-summary__grid">
          <BreakdownCard title={t('rst.reports.summary.byMethod')} rows={data.byMethod} group="method" t={t} />
          <BreakdownCard title={t('rst.reports.summary.byCardType')} rows={data.byCardType} group="card" t={t} />
          <BreakdownCard title={t('rst.reports.summary.byChannel')} rows={data.byChannel} group="channel" t={t} />
          <BreakdownCard title={t('rst.reports.summary.byHall')} rows={data.byHall} group="hall" t={t} />
          <BreakdownCard title={t('rst.reports.byHour')} rows={data.byHour} group="hour" t={t} />
          <BreakdownCard title={t('rst.reports.summary.byDay')} rows={data.byDay} group="day" t={t} />
        </div>
      ) : null}
    </>
  );
}
