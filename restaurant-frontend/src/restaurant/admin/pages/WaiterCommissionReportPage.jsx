import { useMemo, useState, Fragment } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination, { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { userApi } from '../../../api';
import { rstCommissionApi } from '../../api/commission.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/staff-admin.css';

function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function displayName(user) {
  if (!user) return null;
  return user.fullName
    || [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ')
    || user.username
    || null;
}

function WaiterOrdersTable({ storeId, waiterUserId, params, t }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);

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

  const rows = ordersQuery.data?.rows ?? [];
  const total = ordersQuery.data?.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

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

export default function WaiterCommissionReportPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [fromDate, setFromDate] = useState(() => toDateInput(new Date()));
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);

  const params = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T00:00:00`);
    to.setDate(to.getDate() + 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [fromDate, toDate]);

  const reportQuery = useQuery({
    queryKey: ['rst-waiter-commission-report', workspace.storeId, params],
    queryFn: () => rstCommissionApi.report(workspace.storeId, params).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const usersQuery = useQuery({
    queryKey: ['rst-staff-users', workspace.storeId],
    queryFn: () => userApi.getAll().then((r) => r.data ?? []),
    enabled: workspace.storeId != null,
    staleTime: 5 * 60_000,
  });

  const nameById = useMemo(() => {
    const map = new Map();
    for (const user of usersQuery.data ?? []) {
      map.set(String(user.id), displayName(user) || user.username || String(user.id));
    }
    return map;
  }, [usersQuery.data]);

  const report = reportQuery.data;
  const allRows = report?.rows ?? [];
  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages - 1);
  const rows = allRows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-commission-report">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.reportsCommissionCard')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.reportsCommissionHint')}</p>
        </div>
      </div>

      <div className="rst-admin-filters">
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.reports.from')}</span>
          <BaseInput
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => {
              if (!e.target.value) return;
              setFromDate(e.target.value);
              setPage(0);
              setExpanded(null);
            }}
          />
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.reports.to')}</span>
          <BaseInput
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => {
              if (!e.target.value) return;
              setToDate(e.target.value);
              setPage(0);
              setExpanded(null);
            }}
          />
        </label>
      </div>

      {reportQuery.isError ? (
        <div className="rst-notice">{t('rst.admin.reportsLoadFailed')}</div>
      ) : null}

      <div className="rst-staff__stats">
        <div className="rst-staff__stat">
          <strong>{report?.orderCount ?? 0}</strong>
          <span>{t('rst.commission.orders')}</span>
        </div>
        <div className="rst-staff__stat">
          <strong>{fmtMoneyCompact(report?.salesTotal ?? 0)}</strong>
          <span>{t('rst.commission.sales')}</span>
        </div>
        <div className="rst-staff__stat">
          <strong>{fmtMoneyCompact(report?.commissionTotal ?? 0)}</strong>
          <span>{t('rst.commission.total')}</span>
        </div>
      </div>

      <div className="rst-data-card">
        <div className="rst-data-card__head">
          <strong>{t('rst.commission.byWaiter')}</strong>
          <span>{total}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table">
            <thead>
              <tr>
                <th>{t('rst.commission.waiter')}</th>
                <th>{t('rst.commission.orders')}</th>
                <th>{t('rst.commission.sales')}</th>
                <th>{t('rst.commission.total')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reportQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{t('common.loading')}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{t('rst.commission.empty')}</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const id = String(row.waiterUserId);
                  const open = expanded === id;
                  return (
                    <Fragment key={id}>
                      <tr>
                        <td className="rst-data-table__wrap">
                          {nameById.get(id) || id}
                        </td>
                        <td>{row.orderCount}</td>
                        <td>{fmtMoneyCompact(row.salesTotal)}</td>
                        <td><strong>{fmtMoneyCompact(row.commissionTotal)}</strong></td>
                        <td>
                          <BaseButton
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpanded((prev) => (prev === id ? null : id))}
                          >
                            {open ? t('rst.commission.hideOrders') : t('rst.commission.showOrders')}
                          </BaseButton>
                        </td>
                      </tr>
                      {open ? (
                        <tr>
                          <td colSpan={5} className="rst-data-table__nested">
                            <WaiterOrdersTable
                              storeId={workspace.storeId}
                              waiterUserId={id}
                              params={params}
                              t={t}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
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
            onPageChange={(next) => {
              setPage(next);
              setExpanded(null);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
              setExpanded(null);
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
