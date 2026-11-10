import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { analyticsApi } from '../api/analyticsApi';
import { useAnalyticsOverview } from './useAnalyticsOverview';

const PAGE_SIZE = 20;

/**
 * Republic-wide receipts for a day (or selected company day) with server pagination.
 */
export function useAnalyticsReceiptsPage() {
  const [searchParams] = useSearchParams();
  const overview = useAnalyticsOverview();
  const initialDate = searchParams.get('date') || '';

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedDayOverride, setSelectedDayOverride] = useState(initialDate);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [qrFilter, setQrFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [listPage, setListPage] = useState(0);

  const effectiveDay = useMemo(() => {
    if (selectedDayOverride) return selectedDayOverride;
    if (initialDate) return initialDate;
    return overview.republicDays?.slice().reverse().find((d) => Number(d.totalTurnover || 0) > 0)?.date
      || overview.republicDays?.[overview.republicDays.length - 1]?.date
      || '';
  }, [selectedDayOverride, initialDate, overview.republicDays]);

  const companyScoped = Boolean(selectedCompanyId);

  useEffect(() => {
    setListPage(0);
    setSelectedReceipt(null);
  }, [effectiveDay, selectedCompanyId, debouncedSearch, qrFilter]);

  const companyDetailQuery = useQuery({
    queryKey: ['analytics-receipts-company-detail', selectedCompanyId, overview.period],
    queryFn: () => analyticsApi.getCompanyDetail(selectedCompanyId, {
      period: overview.period === 'custom' ? 'custom' : overview.period,
      from: overview.customFrom || undefined,
      to: overview.customTo || undefined,
    }).then((res) => res.data),
    enabled: companyScoped,
  });

  const availableDays = useMemo(() => {
    if (companyScoped) {
      const list = companyDetailQuery.data?.days ?? [];
      return [...list].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    }
    return [...(overview.republicDays || [])]
      .filter((d) => d.date)
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [companyScoped, companyDetailQuery.data?.days, overview.republicDays]);

  const companyKind = qrFilter === 'qr' ? 'QR' : qrFilter === 'no_qr' ? 'NO_QR' : 'ALL';

  const receiptsQuery = useQuery({
    queryKey: [
      'analytics-receipts-list',
      companyScoped,
      selectedCompanyId,
      effectiveDay,
      listPage,
      PAGE_SIZE,
      debouncedSearch,
      companyKind,
    ],
    queryFn: async () => {
      if (!effectiveDay) return { rows: [], totalElements: 0 };
      if (companyScoped) {
        const res = await analyticsApi.getCompanyReceipts(selectedCompanyId, {
          date: effectiveDay,
          page: listPage,
          size: PAGE_SIZE,
          kind: companyKind,
        });
        const data = res.data ?? {};
        const rows = (data.rows ?? []).map((r) => ({
          ...r,
          companyId: r.companyId ?? Number(selectedCompanyId),
        }));
        return { rows, totalElements: Number(data.totalElements ?? rows.length) };
      }
      const res = await analyticsApi.getReceipts({
        period: 'custom',
        from: effectiveDay,
        to: effectiveDay,
        page: listPage,
        size: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
      });
      const data = res.data ?? {};
      let rows = data.rows ?? [];
      if (qrFilter === 'qr') {
        rows = rows.filter((r) => r.hasQr || r.fiscalStatus === 'FISCAL' || r.fiscalStatus === 'CONFIRMED');
      } else if (qrFilter === 'no_qr') {
        rows = rows.filter((r) => !(r.hasQr || r.fiscalStatus === 'FISCAL' || r.fiscalStatus === 'CONFIRMED'));
      }
      return { rows, totalElements: Number(data.totalElements ?? rows.length) };
    },
    enabled: Boolean(effectiveDay) && (!companyScoped || Boolean(selectedCompanyId)),
    placeholderData: (prev) => prev,
  });

  const filteredReceipts = useMemo(() => {
    const rows = receiptsQuery.data?.rows ?? [];
    if (companyScoped || !debouncedSearch.trim()) return rows;
    // Republic search already sent to API; keep local refine for store name.
    const q = debouncedSearch.toLowerCase();
    return rows.filter((r) => {
      const receiptNo = String(r.receiptNumber || r.saleId || '');
      const store = String(r.storeName || '');
      const company = String(r.companyName || '');
      return receiptNo.toLowerCase().includes(q)
        || store.toLowerCase().includes(q)
        || company.toLowerCase().includes(q);
    });
  }, [receiptsQuery.data?.rows, companyScoped, debouncedSearch]);

  const activeCompany = overview.top10Companies.find((c) => String(c.companyId) === String(selectedCompanyId));
  const detailCompanyId = selectedReceipt?.companyId
    || selectedCompanyId
    || activeCompany?.companyId;

  return {
    page: overview,
    selectedCompanyId,
    setSelectedCompanyId: (id) => {
      setSelectedCompanyId(id);
      setSelectedDayOverride('');
      setSelectedReceipt(null);
      setListPage(0);
    },
    effectiveDay,
    setSelectedDayOverride: (d) => {
      setSelectedDayOverride(d);
      setListPage(0);
    },
    search,
    setSearch,
    qrFilter,
    setQrFilter,
    selectedReceipt,
    setSelectedReceipt,
    availableDays,
    filteredReceipts,
    receiptsQuery,
    activeCompany,
    detailCompanyId,
    listPage,
    setListPage,
    pageSize: PAGE_SIZE,
    totalElements: Number(receiptsQuery.data?.totalElements ?? 0),
  };
}
