import { useQuery } from '@tanstack/react-query';
import { geoApi } from '../../../api/geo.api';
import { analyticsApi } from '../api/analyticsApi';

export function useViloyatDetailQueries({ padCode, backendDistrictCode, districtCode, activeType }) {
  const { data: regions = [] } = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data || []),
    staleTime: 600_000,
  });

  const { data: geoDistricts = [] } = useQuery({
    queryKey: ['geo-districts', padCode],
    queryFn: () => geoApi.districts(padCode).then((r) => r.data || []),
    enabled: Boolean(padCode),
    staleTime: 600_000,
  });

  const { data: backendCompaniesData } = useQuery({
    queryKey: ['analytics-companies-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getCompanies({ regionCode: padCode, districtCode: backendDistrictCode, size: 100 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: resultsData } = useQuery({
    queryKey: ['analytics-results-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getResults({ level: districtCode ? 'DISTRICT' : 'REGION', regionCode: padCode, period: '30d' }).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: dailyData = [] } = useQuery({
    queryKey: ['analytics-results-daily', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getResultsDaily({ regionCode: padCode, districtCode: backendDistrictCode, period: '30d' }).then((r) => r.data || []),
    staleTime: 60_000,
  });

  const { data: productsData = null } = useQuery({
    queryKey: ['analytics-results-products', padCode, backendDistrictCode, activeType],
    queryFn: () => analyticsApi.getResultsProducts({ regionCode: padCode, districtCode: backendDistrictCode, activeType, period: '30d' }).then((r) => r.data || null),
    staleTime: 60_000,
  });

  return {
    regions,
    geoDistricts,
    backendCompaniesData,
    resultsData,
    dailyData,
    productsData,
  };
}
