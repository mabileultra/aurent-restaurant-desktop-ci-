import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BaseInput } from '../../../components/ui';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { rstAnalyticsApi } from '../../api/analytics.api';
import { rstPaymentApi } from '../../api/payment.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import RstFilterResetButton from '../../shared/components/RstFilterResetButton';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/analytics-admin.css';
import '../styles/stations-admin.css';

function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatClosedAt(iso) {
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

function methodLabel(method, t) {
  const key = String(method || '').toUpperCase();
  const map = {
    CASH: 'rst.reports.methodCash',
    CARD: 'rst.reports.methodCard',
    MIXED: 'rst.reports.methodMixed',
    CREDIT: 'rst.reports.methodCredit',
    ADVANCE: 'rst.reports.methodAdvance',
  };
  return map[key] ? t(map[key]) : (method || '—');
}

export default function ReportsAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [tab, setTab] = useState('checks');
  const [fromDate, setFromDate] = useState(() => toDateInput(new Date()));
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);

  const params = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T00:00:00`);
    to.setDate(to.getDate() + 1);
    return { from: from.toISOString(), to: to.toISOString(), fromMs: from.getTime(), toMs: to.getTime() };
  }, [fromDate, toDate]);

  const reportQuery = useQuery({
    queryKey: ['rst-sales-report', workspace.storeId, params.from, params.to],
    queryFn: () => rstAnalyticsApi.salesReport(workspace.storeId, {
      from: params.from,
      to: params.to,
    }).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const checksQuery = useQuery({
    queryKey: ['rst-sales-checks', workspace.storeId],
    queryFn: () => rstPaymentApi.listRecentPaid(workspace.storeId, { refunded: false, limit: 100 })
      .then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
  });

  const report = reportQuery.data;
  const checksInRange = useMemo(() => {
    const rows = checksQuery.data ?? [];
    return rows.filter((row) => {
      const ts = row.closedAt ? new Date(row.closedAt).getTime() : NaN;
      if (!Number.isFinite(ts)) return false;
      return ts >= params.fromMs && ts < params.toMs;
    });
  }, [checksQuery.data, params.fromMs, params.toMs]);

  const sourceRows = tab === 'dish'
    ? (report?.byDish ?? [])
    : tab === 'hour'
      ? (report?.byHour ?? [])
      : checksInRange;
  const total = sourceRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rows = sourceRows.slice(page * pageSize, page * pageSize + pageSize);

  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  const changeTab = (next) => {
    setTab(next);
    setPage(0);
  };

  const refresh = () => {
    reportQuery.refetch();
    checksQuery.refetch();
  };

  const tableTitle = tab === 'dish'
    ? t('rst.reports.byDish')
    : tab === 'hour'
      ? t('rst.reports.byHour')
      : t('rst.reports.byChecks');

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.reportsSalesCard')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.reportsSubtitle')}</p>
        </div>
      </div>

      {workspace.isLoading && workspace.storeId == null ? null : !workspace.storeId ? (
        <div className="rst-notice">{t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-admin-filters">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.reports.from')}</span>
              <BaseInput
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{t('rst.reports.to')}</span>
              <BaseInput
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <RstFilterResetButton t={t} onClick={refresh}>
              {t('common.refresh')}
            </RstFilterResetButton>
          </div>

          {reportQuery.isError || checksQuery.isError ? (
            <div className="rst-notice">{t('rst.admin.reportsLoadFailed')}</div>
          ) : null}

          {report ? (
            <div className="rst-dash__grid" style={{ marginBottom: '1rem' }}>
              <div className="rst-dash__card"><span>{t('rst.dashboard.revenue')}</span><strong>{fmtMoneyCompact(report.totalRevenue)}</strong></div>
              <div className="rst-dash__card"><span>{t('rst.reports.payments')}</span><strong>{report.paymentCount}</strong></div>
              <div className="rst-dash__card"><span>{t('rst.dashboard.cash')}</span><strong>{fmtMoneyCompact(report.cashAmount)}</strong></div>
              <div className="rst-dash__card"><span>{t('rst.dashboard.card')}</span><strong>{fmtMoneyCompact(report.cardAmount)}</strong></div>
            </div>
          ) : null}

          <div className="rst-report__tabs">
            <button type="button" className={`rst-report__tab${tab === 'checks' ? ' is-active' : ''}`} onClick={() => changeTab('checks')}>
              {t('rst.reports.byChecks')}
            </button>
            <button type="button" className={`rst-report__tab${tab === 'dish' ? ' is-active' : ''}`} onClick={() => changeTab('dish')}>
              {t('rst.reports.byDish')}
            </button>
            <button type="button" className={`rst-report__tab${tab === 'hour' ? ' is-active' : ''}`} onClick={() => changeTab('hour')}>
              {t('rst.reports.byHour')}
            </button>
          </div>

          <div className="rst-data-card">
            <div className="rst-data-card__head">
              <strong>{tableTitle}</strong>
              <span>{total}</span>
            </div>
            <div className="rst-data-card__table-wrap">
              <table className="rst-data-table">
                <thead>
                  {tab === 'checks' ? (
                    <tr>
                      <th className="rst-data-table__num">#</th>
                      <th>{t('rst.reports.checkNo')}</th>
                      <th>{t('rst.reports.checkTable')}</th>
                      <th>{t('rst.reports.checkClosed')}</th>
                      <th>{t('rst.reports.checkMethod')}</th>
                      <th>{t('rst.reports.amount')}</th>
                    </tr>
                  ) : tab === 'dish' ? (
                    <tr>
                      <th className="rst-data-table__num">#</th>
                      <th>{t('rst.reports.dish')}</th>
                      <th>{t('rst.reports.qty')}</th>
                      <th>{t('rst.reports.amount')}</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="rst-data-table__num">#</th>
                      <th>{t('rst.reports.hour')}</th>
                      <th>{t('rst.reports.payments')}</th>
                      <th>{t('rst.reports.amount')}</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {(tab === 'checks' ? checksQuery.isPending : reportQuery.isPending) && !rows.length ? (
                    <tr>
                      <td colSpan={tab === 'checks' ? 6 : 4} className="rst-data-table__empty">{t('common.loading')}</td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={tab === 'checks' ? 6 : 4} className="rst-data-table__empty">{t('rst.reports.empty')}</td>
                    </tr>
                  ) : tab === 'checks' ? (
                    rows.map((row, index) => (
                      <tr key={row.id}>
                        <td className="rst-data-table__num">{page * pageSize + index + 1}</td>
                        <td>№{row.orderNo}</td>
                        <td>{row.tableCode || '—'}</td>
                        <td>{formatClosedAt(row.closedAt)}</td>
                        <td>{methodLabel(row.paymentMethod, t)}</td>
                        <td>{fmtMoneyCompact(row.paidAmount ?? row.totalAmount)}</td>
                      </tr>
                    ))
                  ) : tab === 'dish' ? (
                    rows.map((row, index) => (
                      <tr key={row.dishName}>
                        <td className="rst-data-table__num">{page * pageSize + index + 1}</td>
                        <td>{row.dishName}</td>
                        <td>{row.quantity}</td>
                        <td>{fmtMoneyCompact(row.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    rows.map((row, index) => (
                      <tr key={row.hour}>
                        <td className="rst-data-table__num">{page * pageSize + index + 1}</td>
                        <td>{String(row.hour).padStart(2, '0')}:00</td>
                        <td>{row.paymentCount}</td>
                        <td>{fmtMoneyCompact(row.amount)}</td>
                      </tr>
                    ))
                  )}
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
        </>
      )}
    </section>
  );
}
