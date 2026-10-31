import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { userApi } from '../../../api';
import { rstCommissionApi } from '../../api/commission.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

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

export function useWaiterCommissionReportPage() {
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

  // Soft fallback when edge_staff has no name for a waiter.
  const usersQuery = useQuery({
    queryKey: ['rst-staff-users', workspace.storeId],
    queryFn: () => userApi.getAll().then((r) => r.data ?? []).catch(() => []),
    enabled: workspace.storeId != null,
    staleTime: 5 * 60_000,
    retry: false,
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

  const resolveWaiterName = (row) => {
    const id = String(row.waiterUserId);
    return row.waiterName || nameById.get(id) || id;
  };

  const onFromDate = (value) => {
    if (!value) return;
    setFromDate(value);
    setPage(0);
    setExpanded(null);
  };

  const onToDate = (value) => {
    if (!value) return;
    setToDate(value);
    setPage(0);
    setExpanded(null);
  };

  return {
    t,
    workspace,
    fromDate,
    toDate,
    onFromDate,
    onToDate,
    expanded,
    setExpanded,
    params,
    reportQuery,
    report,
    rows,
    total,
    page: safePage,
    pageSize,
    totalPages,
    pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
    setPage: (next) => {
      setPage(next);
      setExpanded(null);
    },
    setPageSize: (size) => {
      setPageSize(size);
      setPage(0);
      setExpanded(null);
    },
    resolveWaiterName,
  };
}
