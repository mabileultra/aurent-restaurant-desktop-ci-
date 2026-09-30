import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { rstAnalyticsApi } from '../../api/analytics.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

export const AUDIT_TYPE_FILTERS = [
  'all',
  'PAYMENT',
  'ORDER_OPEN',
  'ORDER_CLOSE',
  'ORDER_CANCEL',
  'SHIFT_OPEN',
  'SHIFT_CLOSE',
  'RESERVATION',
];

const DEFAULT_PAGE_SIZE = 14;

function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyFilters() {
  return {
    search: '',
    type: 'all',
    fromDate: toDateInput(new Date()),
    toDate: toDateInput(new Date()),
  };
}

function formatActivity(t, event) {
  const parts = String(event.summary ?? '').split('|');
  switch (event.type) {
    case 'PAYMENT':
      return t('rst.audit.evtPayment', {
        method: parts[0],
        amount: fmtMoneyCompact(parts[1]),
        orderNo: parts[2],
      });
    case 'ORDER_OPEN':
      return t('rst.audit.evtOrderOpen', { orderNo: event.summary });
    case 'ORDER_CLOSE':
      return t('rst.audit.evtOrderClose', { orderNo: event.summary });
    case 'ORDER_CANCEL':
      return t('rst.audit.evtOrderCancel', { orderNo: event.summary });
    case 'SHIFT_OPEN':
      return t('rst.audit.evtShiftOpen', { cash: fmtMoneyCompact(event.summary) });
    case 'SHIFT_CLOSE':
      return t('rst.audit.evtShiftClose', { revenue: fmtMoneyCompact(event.summary) });
    case 'RESERVATION':
      return t('rst.audit.evtReservation', {
        status: parts[0],
        client: parts[1],
        table: parts[2],
      });
    default:
      return event.summary;
  }
}

export function useAuditAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = useMemo(() => {
    const from = new Date(`${filters.fromDate}T00:00:00`);
    const to = new Date(`${filters.toDate}T00:00:00`);
    to.setDate(to.getDate() + 1);
    return {
      from: Number.isNaN(from.getTime()) ? undefined : from.toISOString(),
      to: Number.isNaN(to.getTime()) ? undefined : to.toISOString(),
    };
  }, [filters.fromDate, filters.toDate]);

  const activityQuery = useQuery({
    queryKey: ['rst-activity', workspace.storeId, params],
    queryFn: () => rstAnalyticsApi.activity(workspace.storeId, params).then((r) => r.data),
    enabled: workspace.storeId != null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(activityQuery.data) ? activityQuery.data : [];
    const q = filters.search.trim().toLowerCase();
    return list.filter((event) => {
      if (filters.type !== 'all' && event.type !== filters.type) return false;
      if (!q) return true;
      const typeLabel = t(`rst.audit.type_${event.type}`, { defaultValue: event.type }).toLowerCase();
      const detail = String(formatActivity(t, event) ?? '').toLowerCase();
      const raw = String(event.summary ?? '').toLowerCase();
      return typeLabel.includes(q) || detail.includes(q) || raw.includes(q);
    });
  }, [activityQuery.data, filters.search, filters.type, t]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages - 1);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return {
    t,
    workspace,
    filters,
    setFilters: (next) => {
      setFilters(next);
      setPage(0);
    },
    resetFilters: () => {
      setFilters(emptyFilters());
      setPage(0);
    },
    rows,
    total,
    page: safePage,
    pageSize,
    pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
    totalPages,
    setPage,
    setPageSize: (size) => {
      setPageSize(size);
      setPage(0);
    },
    isLoading: activityQuery.isPending,
    isError: activityQuery.isError,
    refetch: () => activityQuery.refetch(),
    formatActivity: (event) => formatActivity(t, event),
  };
}
