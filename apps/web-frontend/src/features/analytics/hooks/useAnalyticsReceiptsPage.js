import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { useAnalyticsOverview } from './useAnalyticsOverview';

/**
 * Republic-wide receipts for a day (or selected company day).
 * Chart click passes ?date=YYYY-MM-DD — must NOT be scoped to top-1 firm only.
 */
export function useAnalyticsReceiptsPage() {
  const [searchParams] = useSearchParams();
  const page = useAnalyticsOverview();
  const initialDate = searchParams.get('date') || '';

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedDayOverride, setSelectedDayOverride] = useState(initialDate);
  const [search, setSearch] = useState('');
  const [qrFilter, setQrFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const effectiveDay = useMemo(() => {
    if (selectedDayOverride) return selectedDayOverride;
    if (initialDate) return initialDate;
    return page.republicDays?.slice().reverse().find((d) => Number(d.totalTurnover || 0) > 0)?.date
      || page.republicDays?.[page.republicDays.length - 1]?.date
      || '';
  }, [selectedDayOverride, initialDate, page.republicDays]);

  const companyScoped = Boolean(selectedCompanyId);

  const companyDetailQuery = useQuery({
    queryKey: ['analytics-receipts-company-detail', selectedCompanyId, page.period],
    queryFn: () => analyticsApi.getCompanyDetail(selectedCompanyId, {
      period: page.period === 'custom' ? 'custom' : page.period,
      from: page.customFrom || undefined,
      to: page.customTo || undefined,
    }).then((res) => res.data),
    enabled: companyScoped,
  });

  const availableDays = useMemo(() => {
    if (companyScoped) {
      const list = companyDetailQuery.data?.days ?? [];
      return [...list].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    }
    return [...(page.republicDays || [])]
      .filter((d) => d.date)
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [companyScoped, companyDetailQuery.data?.days, page.republicDays]);

  const receiptsQuery = useQuery({
    queryKey: ['analytics-receipts-list', companyScoped, selectedCompanyId, effectiveDay],
    queryFn: async () => {
      if (!effectiveDay) return [];
      if (companyScoped) {
        const res = await analyticsApi.getCompanyReceipts(selectedCompanyId, {
          date: effectiveDay,
          size: 100,
        });
        return (res.data?.rows ?? []).map((r) => ({
          ...r,
          companyId: r.companyId ?? Number(selectedCompanyId),
        }));
      }
      const res = await analyticsApi.getReceipts({
        period: 'custom',
        from: effectiveDay,
        to: effectiveDay,
        size: 100,
      });
      return res.data?.rows ?? [];
    },
    enabled: Boolean(effectiveDay) && (!companyScoped || Boolean(selectedCompanyId)),
  });

  const rawReceipts = receiptsQuery.data ?? [];

  const filteredReceipts = useMemo(() => {
    return rawReceipts.filter((r) => {
      const receiptNo = String(r.receiptNumber || r.receiptNo || r.saleId || '');
      const store = String(r.storeName || r.store || '');
      const company = String(r.companyName || '');
      const q = search.toLowerCase();
      const matchSearch = !search
        || receiptNo.toLowerCase().includes(q)
        || store.toLowerCase().includes(q)
        || company.toLowerCase().includes(q);
      const hasQr = r.hasQr || r.fiscalStatus === 'FISCAL' || r.fiscalStatus === 'CONFIRMED';
      const matchQr = qrFilter === 'all' ? true : qrFilter === 'qr' ? hasQr : !hasQr;
      return matchSearch && matchQr;
    });
  }, [rawReceipts, search, qrFilter]);

  const activeCompany = page.top10Companies.find((c) => String(c.companyId) === String(selectedCompanyId));
  const detailCompanyId = selectedReceipt?.companyId
    || selectedCompanyId
    || activeCompany?.companyId;

  return {
    page,
    selectedCompanyId,
    setSelectedCompanyId: (id) => {
      setSelectedCompanyId(id);
      setSelectedDayOverride('');
      setSelectedReceipt(null);
    },
    effectiveDay,
    setSelectedDayOverride,
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
  };
}
