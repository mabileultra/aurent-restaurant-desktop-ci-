import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformBillingApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export const COLLECTION_TABS = ['ALL', 'OVERDUE', 'DUE_SOON', 'ACTIVE', 'NEW', 'SUSPENDED'];
export const PAYMENT_METHODS = ['CLICK', 'PAYME', 'BANK_TRANSFER', 'CASH', 'OTHER'];
export const DATE_FIELDS = ['NEXT_CHARGE', 'LAST_PAYMENT', 'CREATED'];
export const COLLECTIONS_QUERY_KEY = 'platform-billing-collections';

const TAB_COUNT_FIELD = {
  ALL: 'totalCompanies',
  OVERDUE: 'overdueCount',
  DUE_SOON: 'dueSoonCount',
  ACTIVE: 'activeCount',
  NEW: 'newCompanies',
  SUSPENDED: 'suspendedCount',
};

function tabParams(tab) {
  if (tab === 'ALL') return {};
  if (tab === 'NEW') return { newOnly: true };
  return { state: tab };
}

export function useBillingCollections() {
  const [tab, setTabState] = useState('ALL');
  const [planId, setPlanIdState] = useState('');
  const [method, setMethodState] = useState('');
  const [dateField, setDateFieldState] = useState('NEXT_CHARGE');
  const [from, setFromState] = useState('');
  const [to, setToState] = useState('');
  const [search, setSearchState] = useState('');
  const [regionCode, setRegionCodeState] = useState('');
  const [districtCode, setDistrictCodeState] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(0);
    setSelectedIds(new Set());
  };

  const params = useMemo(() => ({
    ...tabParams(tab),
    planId: planId || undefined,
    method: method || undefined,
    search: debouncedSearch || undefined,
    dateField: from || to ? dateField : undefined,
    from: from || undefined,
    to: to || undefined,
    regionCode: regionCode || undefined,
    districtCode: districtCode || undefined,
  }), [tab, planId, method, debouncedSearch, dateField, from, to, regionCode, districtCode]);

  const overviewQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'overview'],
    queryFn: () => platformBillingApi.collectionsOverview().then((r) => r.data),
  });

  const rowsQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', params],
    queryFn: () => platformBillingApi.collectionsCompanies(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const upcomingQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', { state: 'DUE_SOON' }],
    queryFn: () => platformBillingApi.collectionsCompanies({ state: 'DUE_SOON' }).then((r) => r.data),
    enabled: false,
  });

  const upcoming = useMemo(
    () => [...(upcomingQ.data || [])].sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0)),
    [upcomingQ.data],
  );

  const rows = rowsQ.data || [];
  const pagedRows = useMemo(
    () => rows.slice(page * pageSize, page * pageSize + pageSize),
    [rows, page, pageSize],
  );

  const pageIds = pagedRows.map((r) => r.billing.companyId);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const toggleSelect = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleSelectPage = () => setSelectedIds((prev) => {
    const next = new Set(prev);
    pageIds.forEach((id) => (allPageSelected ? next.delete(id) : next.add(id)));
    return next;
  });
  const selectedRows = rows.filter((r) => selectedIds.has(r.billing.companyId));

  const overview = overviewQ.data;
  const tabCount = (key) => overview?.[TAB_COUNT_FIELD[key]] ?? null;

  return {
    overview,
    overviewLoading: overviewQ.isLoading,
    tab,
    setTab: resetPage(setTabState),
    tabCount,
    planId,
    setPlanId: resetPage(setPlanIdState),
    method,
    setMethod: resetPage(setMethodState),
    dateField,
    setDateField: resetPage(setDateFieldState),
    from,
    setFrom: resetPage(setFromState),
    to,
    setTo: resetPage(setToState),
    search,
    setSearch: resetPage(setSearchState),
    regionCode,
    districtCode,
    setGeo: ({ regionCode: nextRegion = '', districtCode: nextDistrict = '' }) => {
      setRegionCodeState(nextRegion || '');
      setDistrictCodeState(nextDistrict || '');
      setPage(0);
      setSelectedIds(new Set());
    },
    resetFilters: () => {
      setPlanIdState('');
      setMethodState('');
      setFromState('');
      setToState('');
      setSearchState('');
      setRegionCodeState('');
      setDistrictCodeState('');
      setPage(0);
      setSelectedIds(new Set());
    },
    params,
    selectedIds,
    selectedRows,
    allPageSelected,
    toggleSelect,
    toggleSelectPage,
    clearSelection: () => setSelectedIds(new Set()),
    upcoming,
    upcomingLoading: upcomingQ.isLoading,
    rows,
    pagedRows,
    total: rows.length,
    loading: rowsQ.isLoading,
    isError: rowsQ.isError,
    error: rowsQ.error,
    refetch: rowsQ.refetch,
    page,
    setPage,
    pageSize,
    setPageSize: (size) => {
      setPageSize(size);
      setPage(0);
    },
  };
}
