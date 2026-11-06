import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { useAnalyticsPeriodStore } from './useAnalyticsPeriodStore';

export function useAnalyticsCompanyDetail() {
  const { companyId } = useParams();
  const id = Number(companyId);
  const isValidId = Number.isInteger(id) && id > 0;

  const period = useAnalyticsPeriodStore((s) => s.period);
  const customFrom = useAnalyticsPeriodStore((s) => s.customFrom);
  const customTo = useAnalyticsPeriodStore((s) => s.customTo);
  const setPeriod = useAnalyticsPeriodStore((s) => s.setPeriod);

  const [selectedDayOverride, setSelectedDayOverride] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const queryParams = useMemo(() => {
    if (period === 'custom' && customFrom && customTo) {
      return { period: 'custom', from: customFrom, to: customTo };
    }
    return { period: period === 'custom' ? '30d' : period };
  }, [period, customFrom, customTo]);

  const detailQuery = useQuery({
    queryKey: ['analytics-company-detail', id, queryParams],
    queryFn: () => analyticsApi.getCompanyDetail(id, queryParams).then((res) => res.data),
    enabled: isValidId,
  });

  const days = detailQuery.data?.days ?? [];

  // Pick the most relevant day with actual sales, or last day, or first day
  const effectiveDay = useMemo(() => {
    if (selectedDayOverride) return selectedDayOverride;
    if (days.length === 0) return '';
    // Find the day with highest turnover
    const sortedDays = [...days].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
    return sortedDays[0]?.totalTurnover > 0 ? sortedDays[0].date : (days[days.length - 1]?.date || days[0]?.date || '');
  }, [selectedDayOverride, days]);

  const receiptsQuery = useQuery({
    queryKey: ['analytics-company-receipts', id, effectiveDay],
    queryFn: () => analyticsApi.getCompanyReceipts(id, { date: effectiveDay, size: 50 }).then((res) => res.data),
    enabled: isValidId && Boolean(effectiveDay),
  });

  return {
    companyId: id,
    isValidId,
    period,
    setPeriod,
    selectedDay: effectiveDay,
    setSelectedDay: setSelectedDayOverride,
    selectedReceipt,
    setSelectedReceipt,
    detail: detailQuery.data,
    days,
    loading: detailQuery.isLoading,
    error: detailQuery.isError,
    receipts: receiptsQuery.data?.rows ?? [],
    totalReceipts: receiptsQuery.data?.totalElements ?? 0,
  };
}
