import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';

export function useAnalyticsOverview() {
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedRegionCode, setSelectedRegionCode] = useState(null);
  const [search, setSearch] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [showExtraFilters, setShowExtraFilters] = useState(false);

  const queryParams = useMemo(() => {
    if (period === 'custom' && customFrom && customTo) {
      return { period: 'custom', from: customFrom, to: customTo };
    }
    return { period: period === 'custom' ? '30d' : period };
  }, [period, customFrom, customTo]);

  const overviewQuery = useQuery({
    queryKey: ['analytics-overview', queryParams],
    queryFn: () => analyticsApi.getOverview(queryParams).then((res) => res.data),
  });

  const regionsQuery = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => analyticsApi.getRegions().then((res) => res.data),
    staleTime: 600_000,
  });

  const districtsQuery = useQuery({
    queryKey: ['geo-districts', selectedRegionCode],
    queryFn: () => analyticsApi.getDistricts(selectedRegionCode).then((res) => res.data),
    enabled: Boolean(selectedRegionCode),
    staleTime: 600_000,
  });

  const handleCustomDateChange = ({ from, to }) => {
    setCustomFrom(from);
    setCustomTo(to);
    if (from && to) setPeriod('custom');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRegionCode(null);
    setConnectionStatus('');
  };

  return {
    period,
    setPeriod: (next) => {
      setPeriod(next);
      if (next !== 'custom') {
        setCustomFrom('');
        setCustomTo('');
      }
    },
    customFrom,
    customTo,
    handleCustomDateChange,
    selectedRegionCode,
    setSelectedRegionCode,
    search,
    setSearch,
    connectionStatus,
    setConnectionStatus,
    showExtraFilters,
    setShowExtraFilters,
    handleResetFilters,
    overview: overviewQuery.data,
    loading: overviewQuery.isLoading,
    error: overviewQuery.isError,
    regions: regionsQuery.data ?? [],
    districts: districtsQuery.data ?? [],
  };
}
