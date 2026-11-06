import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taxAnalyticsCompaniesApi } from '../../../api/taxAnalyticsCompanies.api';
import { ANALYTICS_PAGE_SIZES } from './usePagedRows';

const KINDS = ['ALL', 'QR', 'NO_QR'];

export function useCompanyDayReceipts(companyId, date) {
  const [kind, setKind] = useState('ALL');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [saleId, setSaleId] = useState(null);
  const enabled = Boolean(companyId && date);

  const listQuery = useQuery({
    queryKey: ['tax-analytics-receipts', companyId, date, kind, page, size],
    queryFn: () => taxAnalyticsCompaniesApi.receipts(companyId, { date, kind, page, size })
      .then((response) => response.data),
    enabled,
  });

  const detailQuery = useQuery({
    queryKey: ['tax-analytics-receipt', companyId, saleId],
    queryFn: () => taxAnalyticsCompaniesApi.receipt(companyId, saleId).then((response) => response.data),
    enabled: enabled && Boolean(saleId),
  });

  return {
    kinds: KINDS,
    kind,
    setKind: (next) => { setKind(next); setPage(0); },
    page,
    size,
    pageSizes: ANALYTICS_PAGE_SIZES,
    setPage,
    setSize: (next) => { setSize(next); setPage(0); },
    total: listQuery.data?.totalElements ?? 0,
    rows: listQuery.data?.rows ?? [],
    loading: listQuery.isPending,
    error: listQuery.isError,
    saleId,
    openReceipt: setSaleId,
    closeReceipt: () => setSaleId(null),
    receipt: detailQuery.data,
    receiptLoading: detailQuery.isPending,
    receiptError: detailQuery.isError,
  };
}
