import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';

export function useAnalyticsCompanyDetail() {
  const { companyId } = useParams();
  const id = Number(companyId);
  const isValidId = Number.isInteger(id) && id > 0;

  const [period, setPeriod] = useState('30d');
  const [selectedDay, setSelectedDay] = useState('2026-10-24');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const queryParams = useMemo(() => ({ period }), [period]);

  const detailQuery = useQuery({
    queryKey: ['analytics-company-detail', id, queryParams],
    queryFn: () => analyticsApi.getCompanyDetail(id, queryParams).then((res) => res.data),
    enabled: isValidId,
  });

  const receiptsQuery = useQuery({
    queryKey: ['analytics-company-receipts', id, selectedDay],
    queryFn: () => analyticsApi.getCompanyReceipts(id, { date: selectedDay, size: 50 }).then((res) => res.data),
    enabled: isValidId && Boolean(selectedDay),
  });

  return {
    companyId: id,
    isValidId,
    period,
    setPeriod,
    selectedDay,
    setSelectedDay,
    selectedReceipt,
    setSelectedReceipt,
    detail: detailQuery.data,
    loading: detailQuery.isLoading,
    error: detailQuery.isError,
    receipts: receiptsQuery.data?.rows ?? [],
    totalReceipts: receiptsQuery.data?.totalElements ?? 51,
  };
}
