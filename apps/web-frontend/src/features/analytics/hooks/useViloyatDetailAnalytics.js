import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { geoApi } from '../../../api/geo.api';
import { analyticsApi } from '../api/analyticsApi';
import {
  SAMARQAND_TYPES,
  SAMARQAND_TURNOVER,
  SAMARQAND_DAYS,
  SAMARQAND_PRODUCTS,
  SAMARQAND_COMPANIES,
  SAMARQAND_DISTRICTS,
  BUSINESS_TYPE_NAMES,
} from '../data/samarqandMockData';
import {
  calculateRingDash,
  calculateDistrictsBreakdown,
  filterAndPaginateCompanies,
  formatCompanyRows,
  mapDistrictNames,
} from '../utils/viloyatDetailUtils';
import {
  normalizeCompaniesList,
  computeDistrictTurnover,
  computeBusinessTypeTabs,
  generateDailyBars,
  resolveDistrictMeta,
  buildDistrictOptions,
  mapProductList,
} from '../utils/viloyatDetailStats';

export function useViloyatDetailAnalytics(regionCode) {
  const padCode = String(regionCode || '18').padStart(2, '0');
  const [searchParams, setSearchParams] = useSearchParams();
  const districtParam = searchParams.get('district');
  const [activeType, setActiveType] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(districtParam || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (districtParam && districtParam !== selectedDistrict) {
      setSelectedDistrict(districtParam);
      setCurrentPage(0);
    } else if (!districtParam && selectedDistrict !== 'all') {
      setSelectedDistrict('all');
      setCurrentPage(0);
    }
  }, [districtParam]);

  const isDistrictView = Boolean(selectedDistrict && selectedDistrict !== 'all');
  const districtCode = isDistrictView ? selectedDistrict : null;

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
    queryKey: ['analytics-companies-detail', padCode, districtCode],
    queryFn: () => analyticsApi.getCompanies({ regionCode: padCode, districtCode: districtCode || undefined, size: 100 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const currentRegion = regions.find((r) => String(r.code).padStart(2, '0') === padCode);
  const regionName = currentRegion?.nameUz || currentRegion?.nameRu || (padCode === '18' ? 'Samarqand viloyati' : `Viloyat (${padCode})`);

  const districtNames = useMemo(
    () => mapDistrictNames(geoDistricts, SAMARQAND_DISTRICTS),
    [geoDistricts]
  );

  const districtOptions = useMemo(() => buildDistrictOptions(districtNames), [districtNames]);
  const districtName = districtCode ? (districtNames[districtCode] || `Tuman (${districtCode})`) : null;
  const rawCompanies = useMemo(
    () => normalizeCompaniesList(backendCompaniesData?.rows, SAMARQAND_COMPANIES),
    [backendCompaniesData?.rows]
  );

  const districtScopedCompanies = useMemo(() => {
    if (!isDistrictView) return rawCompanies;
    return rawCompanies.filter((c) => c[3] === districtCode);
  }, [rawCompanies, isDistrictView, districtCode]);

  const turnover = useMemo(() => computeDistrictTurnover({
    companies: districtScopedCompanies,
    activeType,
    isDistrictView,
    baseTurnover: SAMARQAND_TURNOVER[activeType] || SAMARQAND_TURNOVER.A,
  }), [districtScopedCompanies, activeType, isDistrictView]);

  const hasSales = turnover.all > 0;
  const fShare = hasSales ? (turnover.allF / turnover.all) * 100 : 0;
  const types = useMemo(() => computeBusinessTypeTabs({
    companies: districtScopedCompanies,
    isDistrictView,
    baseTypes: SAMARQAND_TYPES,
  }), [districtScopedCompanies, isDistrictView]);

  const currentTypeConfig = types.find((t) => t.id === activeType) || types[0];
  const connPct = currentTypeConfig.n > 0 ? (currentTypeConfig.c / currentTypeConfig.n) * 100 : 0;
  const fiscalRing = calculateRingDash(turnover.f30);
  const connRing = calculateRingDash(connPct);

  const meta = useMemo(() => resolveDistrictMeta({
    isDistrictView,
    totalCount: districtScopedCompanies.length,
    connectedCount: districtScopedCompanies.filter((c) => c[5] === 1).length,
    totalDistricts: Object.keys(districtNames).length,
  }), [isDistrictView, districtScopedCompanies, districtNames]);

  const dailyBars = useMemo(
    () => generateDailyBars(SAMARQAND_DAYS, isDistrictView ? (turnover.all / (SAMARQAND_TURNOVER.A?.all || 1)) : 1),
    [isDistrictView, turnover.all]
  );

  const productGroup = SAMARQAND_PRODUCTS[activeType] || { top: [], low: [] };
  const topProducts = useMemo(() => mapProductList(productGroup.top), [productGroup.top]);
  const lowProducts = useMemo(() => mapProductList(productGroup.low), [productGroup.low]);

  const filteredDistricts = useMemo(() => {
    const inType = rawCompanies.filter((c) => activeType === 'A' || c[4] === activeType);
    return calculateDistrictsBreakdown(inType, districtNames);
  }, [rawCompanies, activeType, districtNames]);

  const tableData = useMemo(() => {
    const res = filterAndPaginateCompanies(rawCompanies, {
      type: activeType,
      district: selectedDistrict,
      status: selectedStatus,
      query: searchQuery,
      page: currentPage,
      pageSize: 10,
    });
    const rows = formatCompanyRows(res, districtNames, BUSINESS_TYPE_NAMES);
    return { ...res, rows };
  }, [rawCompanies, activeType, selectedDistrict, selectedStatus, searchQuery, currentPage, districtNames]);

  const handleDistrictChange = (d) => {
    setSelectedDistrict(d);
    setCurrentPage(0);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (d && d !== 'all') next.set('district', d);
      else next.delete('district');
      return next;
    });
  };

  return {
    padCode,
    regionName,
    districtCode,
    districtName,
    isDistrictView,
    activeType,
    setActiveType: (t) => { setActiveType(t); setCurrentPage(0); },
    types,
    meta,
    turnover,
    hasSales,
    fShare,
    dailyBars,
    fiscalRing,
    connRing,
    connPercent: connPct,
    currentTypeConfig,
    topProducts,
    lowProducts,
    districtsBreakdown: filteredDistricts,
    districtOptions,
    selectedDistrict,
    setSelectedDistrict: handleDistrictChange,
    onClearDistrict: () => handleDistrictChange('all'),
    selectedStatus,
    setSelectedStatus: (s) => { setSelectedStatus(s); setCurrentPage(0); },
    searchQuery,
    setSearchQuery: (q) => { setSearchQuery(q); setCurrentPage(0); },
    tableData,
    onPrevPage: () => setCurrentPage((p) => Math.max(0, p - 1)),
    onNextPage: () => setCurrentPage((p) => Math.min(tableData.totalPages - 1, p + 1)),
  };
}

export default useViloyatDetailAnalytics;
