import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { rstShiftApi } from '../../api/shift.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

export const SHIFTS_PAGE_SIZE_OPTIONS = [10, 14, 20];
const DEFAULT_PAGE_SIZE = 14;

const emptyFilters = () => ({
  status: 'all',
  fromDate: '',
  toDate: '',
});

function toDayStart(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDayEnd(value) {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useShiftsAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const shiftsQuery = useQuery({
    queryKey: ['rst-shifts', workspace.storeId],
    queryFn: () => rstShiftApi.list(workspace.storeId).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  const shifts = useMemo(() => {
    const list = Array.isArray(shiftsQuery.data) ? [...shiftsQuery.data] : [];
    list.sort((a, b) => {
      const ta = a.openedAt ? new Date(a.openedAt).getTime() : 0;
      const tb = b.openedAt ? new Date(b.openedAt).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [shiftsQuery.data]);

  const filtered = useMemo(() => {
    const from = toDayStart(filters.fromDate);
    const to = toDayEnd(filters.toDate);
    return shifts.filter((shift) => {
      if (filters.status === 'open' && shift.status !== 'OPEN') return false;
      if (filters.status === 'closed' && shift.status !== 'CLOSED') return false;
      if (from || to) {
        const opened = shift.openedAt ? new Date(shift.openedAt) : null;
        if (!opened) return false;
        if (from && opened < from) return false;
        if (to && opened > to) return false;
      }
      return true;
    });
  }, [shifts, filters]);

  const total = filtered.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = useMemo(() => {
    const start = safePage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const stats = useMemo(() => ({
    total: shifts.length,
    open: shifts.filter((s) => s.status === 'OPEN').length,
    closed: shifts.filter((s) => s.status === 'CLOSED').length,
  }), [shifts]);

  return {
    t,
    workspace,
    rows,
    stats,
    filters,
    setFilters: (next) => {
      setFilters(next);
      setPage(0);
    },
    resetFilters: () => {
      setFilters(emptyFilters());
      setPage(0);
    },
    page: safePage,
    pageSize,
    total,
    totalPages,
    setPage: (next) => setPage(Math.max(0, Math.min(next, totalPages - 1))),
    setPageSize: (nextSize) => {
      setPageSize(nextSize);
      setPage(0);
    },
    pageSizeOptions: SHIFTS_PAGE_SIZE_OPTIONS,
    isLoading: (workspace.storeId == null && workspace.isLoading) || shiftsQuery.isLoading,
    isError: shiftsQuery.isError,
    refetch: shiftsQuery.refetch,
  };
}
