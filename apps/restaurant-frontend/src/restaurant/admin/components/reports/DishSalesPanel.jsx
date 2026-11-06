import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../../components/shared/TablePagination';
import ReportExportButton from '../../../../features/reports/components/ReportExportButton';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { rstReportApi } from '../../../api/report.api';
import { useReportDirectory } from '../../hooks/useReportDirectory';
import {
  EMPTY_RECEIPT_FILTERS,
  buildDishExportBody,
  buildReceiptFilter,
  filterDishRows,
  toReceiptQueryParams,
} from '../../utils/receiptJournal';
import ReportFilterBar from './ReportFilterBar';
import '../../styles/receipt-journal.css';

function qty(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString([], { maximumFractionDigits: 3 }) : '—';
}

export default function DishSalesPanel({ storeId, fromDate, toDate, t }) {
  const [filters, setFilters] = useState(EMPTY_RECEIPT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const directory = useReportDirectory(storeId, t);

  const filter = useMemo(() => buildReceiptFilter({ fromDate, toDate, filters }), [fromDate, toDate, filters]);

  const dishesQuery = useQuery({
    queryKey: ['rst-dish-sales', storeId, filter],
    queryFn: () => rstReportApi.dishes(storeId, toReceiptQueryParams(filter)).then((r) => r.data),
    enabled: storeId != null,
    placeholderData: keepPreviousData,
  });

  const data = dishesQuery.data;
  const visible = useMemo(() => filterDishRows(data?.rows, search), [data?.rows, search]);
  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages - 1);
  const rows = visible.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <>
      <ReportFilterBar
        t={t}
        filters={filters}
        onChange={(key, value) => {
          setFilters((prev) => ({ ...prev, [key]: value }));
          setPage(0);
        }}
        onReset={() => {
          setFilters(EMPTY_RECEIPT_FILTERS);
          setSearch('');
          setPage(0);
        }}
        directory={directory}
        search={{
          value: search,
          placeholder: t('rst.reports.dishes.searchPh'),
          onChange: (value) => {
            setSearch(value);
            setPage(0);
          },
        }}
      >
        <ReportExportButton
          fetchBlob={() => rstReportApi.exportDishes(storeId, buildDishExportBody(filter, { t }))}
          filenamePrefix="rst_dishes"
          disabled={storeId == null || !data?.rows?.length}
        />
      </ReportFilterBar>

      {dishesQuery.isError ? <div className="rst-notice">{t('rst.admin.reportsLoadFailed')}</div> : null}

      {data ? (
        <div className="rst-dash__grid rst-journal__totals">
          <div className="rst-dash__card"><span>{t('rst.reports.dishes.positions')}</span><strong>{data.rows.length}</strong></div>
          <div className="rst-dash__card"><span>{t('rst.reports.dishes.netQty')}</span><strong>{qty(data.netQuantity)}</strong></div>
          <div className="rst-dash__card"><span>{t('rst.reports.amount')}</span><strong>{fmtMoneyCompact(data.grossAmount)}</strong></div>
          <div className="rst-dash__card"><span>{t('rst.reports.journal.totalRefunds')}</span><strong>{fmtMoneyCompact(data.refundAmount)}</strong></div>
          <div className="rst-dash__card"><span>{t('rst.reports.journal.colNet')}</span><strong>{fmtMoneyCompact(data.netAmount)}</strong></div>
        </div>
      ) : null}

      <div className="rst-data-card">
        <div className="rst-data-card__head">
          <strong>{t('rst.reports.dishes.title')}</strong>
          <span>{total}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table">
            <thead>
              <tr>
                <th className="rst-data-table__num">#</th>
                <th>{t('rst.reports.dish')}</th>
                <th>{t('rst.reports.dishes.category')}</th>
                <th className="rst-journal__money">{t('rst.reports.dishes.sold')}</th>
                <th className="rst-journal__money">{t('rst.reports.dishes.returned')}</th>
                <th className="rst-journal__money">{t('rst.reports.dishes.netQty')}</th>
                <th className="rst-journal__money">{t('rst.reports.amount')}</th>
                <th className="rst-journal__money">{t('rst.reports.journal.colRefund')}</th>
                <th className="rst-journal__money">{t('rst.reports.journal.colNet')}</th>
                <th className="rst-journal__money">{t('rst.reports.dishes.share')}</th>
              </tr>
            </thead>
            <tbody>
              {dishesQuery.isPending ? (
                <tr><td colSpan={10} className="rst-data-table__empty">{t('common.loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="rst-data-table__empty">{t('rst.reports.empty')}</td></tr>
              ) : rows.map((row, index) => (
                <tr key={`${row.name}|${row.category ?? ''}`}>
                  <td className="rst-data-table__num">{safePage * pageSize + index + 1}</td>
                  <td>{row.name}</td>
                  <td>{row.category || '—'}</td>
                  <td className="rst-journal__money">{qty(row.quantity)}</td>
                  <td className="rst-journal__money">{Number(row.returnedQuantity) > 0 ? qty(row.returnedQuantity) : '—'}</td>
                  <td className="rst-journal__money">{qty(row.netQuantity)}</td>
                  <td className="rst-journal__money">{fmtMoneyCompact(row.grossAmount)}</td>
                  <td className="rst-journal__money">
                    {Number(row.refundAmount) > 0 ? fmtMoneyCompact(row.refundAmount) : '—'}
                  </td>
                  <td className="rst-journal__money"><strong>{fmtMoneyCompact(row.netAmount)}</strong></td>
                  <td className="rst-journal__money">{Number(row.sharePercent).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 0 ? (
          <TablePagination
            className="rst-data-card__pagination"
            page={safePage}
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
    </>
  );
}
