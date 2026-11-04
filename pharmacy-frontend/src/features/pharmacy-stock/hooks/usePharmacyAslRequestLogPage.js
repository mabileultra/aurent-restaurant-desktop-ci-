import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { aslRequestLogApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import {
  PHARM_DEFAULT_PAGE_SIZE,
  PHARM_PAGE_SIZES,
} from '../utils/pharmacyTablePage';

/**
 * Мониторинг: ушёл ли запрос реально в ASL Belgisi.
 */
export function usePharmacyAslRequestLogPage() {
  const { t } = useTranslation();
  const { stores, onlyStore, resolveStoreId } = useCompanyStores();

  const [storeId, setStoreId] = useState(() => (onlyStore ? String(onlyStore.id) : ''));
  const [operation, setOperation] = useState('');
  const [outcome, setOutcome] = useState('');
  const [reached, setReached] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PHARM_DEFAULT_PAGE_SIZE);

  const resolvedStoreId = resolveStoreId(storeId) ?? (storeId ? Number(storeId) : null);

  const listQuery = useQuery({
    queryKey: [
      'asl-request-logs',
      resolvedStoreId,
      operation,
      outcome,
      reached,
      search,
      page,
      pageSize,
    ],
    queryFn: () => aslRequestLogApi.list({
      storeId: resolvedStoreId || undefined,
      operation: operation || undefined,
      outcome: outcome || undefined,
      reached: reached === '' ? undefined : reached === 'true',
      search: search.trim() || undefined,
      page,
      size: pageSize,
    }).then((r) => r.data),
  });

  const rows = listQuery.data?.content ?? [];
  const total = listQuery.data?.totalElements ?? rows.length;
  const totalPages = listQuery.data?.totalPages ?? 1;

  const storeOptions = useMemo(() => ([
    { value: '', label: t('pharmacyStock.aslRequestLog.allStores') },
    ...stores.map((s) => ({ value: String(s.id), label: s.name })),
  ]), [stores, t]);

  const operationFilters = useMemo(() => ([
    { value: '', label: t('pharmacyStock.aslRequestLog.filterAllOps') },
    { value: 'VERIFY', label: t('pharmacyStock.aslRequestLog.opVerify') },
    { value: 'WITHDRAW', label: t('pharmacyStock.aslRequestLog.opWithdraw') },
  ]), [t]);

  const outcomeFilters = useMemo(() => ([
    { value: '', label: t('pharmacyStock.aslRequestLog.filterAllOutcomes') },
    { value: 'SENT_OK', label: t('pharmacyStock.aslRequestLog.outcomeSentOk') },
    { value: 'SENT_WAITING', label: t('pharmacyStock.aslRequestLog.outcomeSentWaiting') },
    { value: 'SENT_FAIL', label: t('pharmacyStock.aslRequestLog.outcomeSentFail') },
    { value: 'NOT_SENT', label: t('pharmacyStock.aslRequestLog.outcomeNotSent') },
  ]), [t]);

  const reachedFilters = useMemo(() => ([
    { value: '', label: t('pharmacyStock.aslRequestLog.filterAllReached') },
    { value: 'true', label: t('pharmacyStock.aslRequestLog.reachedYes') },
    { value: 'false', label: t('pharmacyStock.aslRequestLog.reachedNo') },
  ]), [t]);

  const resetPage = () => setPage(0);

  return {
    t,
    storeId,
    setStoreId: (v) => { setStoreId(v); resetPage(); },
    storeOptions,
    operation,
    setOperation: (v) => { setOperation(v); resetPage(); },
    operationFilters,
    outcome,
    setOutcome: (v) => { setOutcome(v); resetPage(); },
    outcomeFilters,
    reached,
    setReached: (v) => { setReached(v); resetPage(); },
    reachedFilters,
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
    loading: listQuery.isFetching,
    isError: listQuery.isError,
    errorMessage: resolvePharmacyApiError(
      listQuery.error,
      t,
      'pharmacyStock.aslRequestLog.loadFailed',
    ),
    refresh: () => listQuery.refetch(),
  };
}
