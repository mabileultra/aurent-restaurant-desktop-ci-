import { useQuery } from '@tanstack/react-query';
import { geoApi } from '../../../api/geo.api';
import { analyticsApi } from '../api/analyticsApi';

export function useViloyatDetailQueries({ padCode, backendDistrictCode, districtCode }) {
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

  const companiesQuery = useQuery({
    queryKey: ['analytics-companies-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getCompanies({ regionCode: padCode, districtCode: backendDistrictCode, size: 100 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const resultsQuery = useQuery({
    queryKey: ['analytics-results-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getResults({ level: districtCode ? 'DISTRICT' : 'REGION', regionCode: padCode, period: '30d' }).then((r) => r.data),
    staleTime: 60_000,
  });

  const dailyQuery = useQuery({
    queryKey: ['analytics-daily-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getDaily({
      regionCode: padCode,
      districtCode: backendDistrictCode,
      period: '30d',
    }).then((r) => r.data),
    staleTime: 60_000,
  });

  const productsQuery = useQuery({
    queryKey: ['analytics-products-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getProducts({
      regionCode: padCode,
      districtCode: backendDistrictCode,
      period: '30d',
      limit: 5,
    }).then((r) => r.data),
    staleTime: 60_000,
  });

  return {
    regions,
    geoDistricts,
    companiesQuery,
    backendCompaniesData: companiesQuery.data,
    resultsQuery,
    resultsData: resultsQuery.data,
    dailyQuery,
    dailyData: dailyQuery.data,
    productsQuery,
    productsData: productsQuery.data,
  };
}
