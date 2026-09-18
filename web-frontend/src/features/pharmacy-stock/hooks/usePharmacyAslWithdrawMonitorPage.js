import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { pharmacyShiftApi, pharmacyStockMarksApi } from '../../../api';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import {
  PHARM_DEFAULT_PAGE_SIZE,
  PHARM_PAGE_SIZES,
} from '../utils/pharmacyTablePage';

function startOfLocalDayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Админ-мониторинг: продажа КМ vs реальное выбытие в ASL.
 */
export function usePharmacyAslWithdrawMonitorPage() {
  const { t } = useTranslation();
  const { stores, onlyStore, resolveStoreId } = useCompanyStores();

  const [storeId, setStoreId] = useState(() => (onlyStore ? String(onlyStore.id) : ''));
  const [status, setStatus] = useState('');
  const [problemsOnly, setProblemsOnly] = useState(true);
  const [currentShiftOnly, setCurrentShiftOnly] = useState(false);
  const [soldTodayOnly, setSoldTodayOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PHARM_DEFAULT_PAGE_SIZE);

  const resolvedStoreId = resolveStoreId(storeId) ?? (storeId ? Number(storeId) : null);

  const shiftQuery = useQuery({
    queryKey: ['pharmacy-shift-current', resolvedStoreId],
    queryFn: () => pharmacyShiftApi.current(resolvedStoreId).then((r) => r.data),
    enabled: Boolean(currentShiftOnly && resolvedStoreId),
    retry: false,
  });

  const shiftId = currentShiftOnly ? (shiftQuery.data?.id || null) : null;

  const listQuery = useQuery({
    queryKey: [
      'pharmacy-asl-marks',
      resolvedStoreId,
      status,
      problemsOnly,
      shiftId,
      soldTodayOnly,
      search,
      page,
      pageSize,
    ],
    queryFn: () => pharmacyStockMarksApi.list({
      storeId: resolvedStoreId || undefined,
      status: status || undefined,
      shiftId: shiftId || undefined,
      soldFrom: soldTodayOnly ? startOfLocalDayIso() : undefined,
      problemsOnly,
      search: search.trim() || undefined,
      page,
      size: pageSize,
    }).then((r) => r.data),
  });

  const rows = listQuery.data?.content ?? [];
  const total = listQuery.data?.totalElements ?? rows.length;
  const totalPages = listQuery.data?.totalPages ?? 1;
  const attentionCount = rows.filter((row) => row.needsAttention).length;

  const statusFilters = useMemo(() => ([
    { value: '', label: t('pharmacyStock.aslMonitor.filterAllStatuses') },
    { value: 'PENDING_WITHDRAW', label: t('pharmacyStock.aslMonitor.statusPending') },
    { value: 'SOLD', label: t('pharmacyStock.aslMonitor.statusSold') },
    { value: 'IN_STOCK', label: t('pharmacyStock.aslMonitor.statusInStock') },
    { value: 'RETURNED', label: t('pharmacyStock.aslMonitor.statusReturned') },
  ]), [t]);

  const storeOptions = useMemo(() => ([
    { value: '', label: t('pharmacyStock.aslMonitor.allStores') },
    ...stores.map((s) => ({ value: String(s.id), label: s.name })),
  ]), [stores, t]);

  const resetPage = () => setPage(0);

  return {
    t,
    storeId,
    setStoreId: (v) => { setStoreId(v); resetPage(); },
    storeOptions,
    status,
    setStatus: (v) => { setStatus(v); resetPage(); },
    statusFilters,
    problemsOnly,
    setProblemsOnly: (v) => { setProblemsOnly(v); resetPage(); },
    currentShiftOnly,
    setCurrentShiftOnly: (v) => { setCurrentShiftOnly(v); resetPage(); },
    soldTodayOnly,
    setSoldTodayOnly: (v) => { setSoldTodayOnly(v); resetPage(); },
    search,
    setSearch: (v) => { setSearch(v); resetPage(); },
    page,
    setPage,
    pageSize,
    setPageSize: (v) => { setPageSize(v); resetPage(); },
    pageSizeOptions: PHARM_PAGE_SIZES,
    rows,
    total,
    totalPages,
    attentionCount,
    loading: listQuery.isFetching,
    isError: listQuery.isError,
    errorMessage: listQuery.error?.response?.data?.message
      ?? listQuery.error?.message
      ?? t('pharmacyStock.aslMonitor.loadFailed'),
    refresh: () => listQuery.refetch(),
    shiftMissing: currentShiftOnly && resolvedStoreId && !shiftQuery.isFetching && !shiftId,
  };
}
