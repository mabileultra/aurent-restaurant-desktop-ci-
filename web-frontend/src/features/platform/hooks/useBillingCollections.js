import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { platformBillingApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { unwrapBillingCollectionsPage } from '../utils/unwrapBillingCollectionsPage';

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

function rowKey(row) {
  return row?.billing?.companyId;
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
  const [selectedMap, setSelectedMap] = useState(() => new Map());
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(0);
    setSelectedMap(new Map());
  };

  const filterParams = useMemo(() => ({
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

  const params = useMemo(
    () => ({ ...filterParams, page, size: pageSize }),
    [filterParams, page, pageSize]
  );

  const overviewQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'overview'],
    queryFn: () => platformBillingApi.collectionsOverview().then((r) => r.data),
  });

  const rowsQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', params],
    queryFn: () => platformBillingApi.collectionsCompanies(params).then((r) => unwrapBillingCollectionsPage(r.data)),
    placeholderData: keepPreviousData,
  });

  const upcomingQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', { state: 'DUE_SOON', page: 0, size: 50 }],
    queryFn: () => platformBillingApi
      .collectionsCompanies({ state: 'DUE_SOON', page: 0, size: 50 })
      .then((r) => unwrapBillingCollectionsPage(r.data).content),
    enabled: false,
  });

  const upcoming = useMemo(
    () => [...(upcomingQ.data || [])].sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0)),
    [upcomingQ.data],
  );

  const pageData = rowsQ.data;
  const pagedRows = pageData?.content ?? [];
  const total = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  const selectedIds = useMemo(() => new Set(selectedMap.keys()), [selectedMap]);
  const selectedRows = useMemo(() => [...selectedMap.values()], [selectedMap]);

  const pageIds = pagedRows.map((r) => rowKey(r)).filter((id) => id != null);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedMap.has(id));

  const toggleSelect = (rowOrId) => {
    const id = typeof rowOrId === 'object' ? rowKey(rowOrId) : rowOrId;
    if (id == null) return;
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else {
        const row = typeof rowOrId === 'object'
          ? rowOrId
          : pagedRows.find((r) => rowKey(r) === id);
        if (row) next.set(id, row);
      }
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pagedRows.forEach((row) => {
          const id = rowKey(row);
          if (id != null) next.set(id, row);
        });
      }
      return next;
    });
  };

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
      setSelectedMap(new Map());
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
      setSelectedMap(new Map());
    },
    params: filterParams,
    selectedIds,
    selectedRows,
    allPageSelected,
    toggleSelect,
    toggleSelectPage,
    clearSelection: () => setSelectedMap(new Map()),
    upcoming,
    upcomingLoading: upcomingQ.isLoading,
    rows: pagedRows,
    pagedRows,
    total,
    totalPages,
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
