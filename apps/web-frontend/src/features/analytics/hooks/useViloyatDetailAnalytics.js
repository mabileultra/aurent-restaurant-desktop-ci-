import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { geoApi } from '../../../api/geo.api';
import { analyticsApi } from '../api/analyticsApi';
import { fmtDayShort } from '../utils/analyticsFormat';
import {
  SAMARQAND_TYPES, SAMARQAND_DISTRICTS, BUSINESS_TYPE_NAMES,
} from '../data/samarqandMockData';
import {
  calculateRingDash, calculateDistrictsBreakdown, filterAndPaginateCompanies,
  formatCompanyRows, mapDistrictNames,
} from '../utils/viloyatDetailUtils';
import {
  normalizeBackendCompany, computeDistrictTurnover, computeBusinessTypeTabs,
  resolveDistrictMeta, buildDistrictOptions,
  mapBackendProductList, mapBackendDailyBars,
  calculateCompaniesBreakdown,
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

  const backendDistrictCode = districtCode
    ? (districtCode.length <= 2 ? `${padCode}${districtCode}` : districtCode)
    : undefined;

  const companiesQuery = useQuery({
    queryKey: ['analytics-companies-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getCompanies({ regionCode: padCode, districtCode: backendDistrictCode, size: 100 }).then((r) => r.data),
    staleTime: 60_000,
  });
  const backendCompaniesData = companiesQuery.data;

  const resultsQuery = useQuery({
    queryKey: ['analytics-results-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getResults({ level: districtCode ? 'DISTRICT' : 'REGION', regionCode: padCode, period: '30d' }).then((r) => r.data),
    staleTime: 60_000,
  });
  const resultsData = resultsQuery.data;

  const dailyQuery = useQuery({
    queryKey: ['analytics-daily-detail', padCode, backendDistrictCode],
    queryFn: () => analyticsApi.getDaily({
      regionCode: padCode,
      districtCode: backendDistrictCode,
      period: '30d',
    }).then((r) => r.data),
    staleTime: 60_000,
  });
  const dailyData = dailyQuery.data;

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
  const productsData = productsQuery.data;

  const currentRegion = regions.find((r) => String(r.code).padStart(2, '0') === padCode);
  const regionName = currentRegion?.nameUz || currentRegion?.nameRu || (padCode === '18' ? 'Samarqand viloyati' : `Viloyat (${padCode})`);

  const districtNames = useMemo(() => mapDistrictNames(geoDistricts, SAMARQAND_DISTRICTS), [geoDistricts]);
  const districtOptions = useMemo(() => buildDistrictOptions(districtNames), [districtNames]);
  const districtName = districtCode
    ? (districtNames[districtCode] || districtNames[districtCode.slice(-2)] || districtNames[`${padCode}${districtCode}`] || `Tuman (${districtCode})`)
    : null;
  const rawCompanies = useMemo(() => {
    if (Array.isArray(backendCompaniesData?.rows)) {
      return backendCompaniesData.rows.map(normalizeBackendCompany).filter(Boolean);
    }
    // Avoid mock flash: empty until companies API resolves.
    if (companiesQuery.isSuccess || companiesQuery.isError) return [];
    return [];
  }, [backendCompaniesData?.rows, companiesQuery.isSuccess, companiesQuery.isError]);

  const districtScopedCompanies = useMemo(() => {
    if (!isDistrictView) return rawCompanies;
    const target = String(districtCode || '').slice(-2);
    return rawCompanies.filter((c) => String(c[3] || '').slice(-2) === target);
  }, [rawCompanies, isDistrictView, districtCode]);

  const resultRow = useMemo(() => {
    const rows = resultsData?.rows;
    if (!rows?.length) return null;
    if (districtCode) {
      const target = String(districtCode).slice(-2);
      return rows.find((r) => String(r.code || '').slice(-2) === target) || rows[0];
    }
    return rows.find((r) => String(r.code || '').endsWith(padCode) || String(r.code || '') === padCode) || rows[0];
  }, [resultsData?.rows, districtCode, padCode]);

  const turnover = useMemo(() => {
    if (resultRow && activeType === 'A') {
      const all = Number(resultRow.totalTurnover || 0);
      const allF = Number(resultRow.fiscalTurnover || 0);
      const allN = Number(resultRow.nonFiscalTurnover || 0);
      const f30 = resultRow.fiscalSharePct != null ? Number(resultRow.fiscalSharePct) : (all > 0 ? (allF / all) * 100 : null);
      return {
        all, allF, allN, f30, m30: all,
        d7: resultRow.weekTurnover != null ? Number(resultRow.weekTurnover) : 0,
        day: resultRow.todayTurnover != null ? Number(resultRow.todayTurnover) : 0,
        year: resultRow.yearTurnover != null ? Number(resultRow.yearTurnover) : all,
        weekDeltaPct: resultRow.weekDeltaPct != null ? Number(resultRow.weekDeltaPct) : null,
        turnoverDeltaPct: resultRow.turnoverDeltaPct != null ? Number(resultRow.turnoverDeltaPct) : null,
      };
    }
    return computeDistrictTurnover({ companies: districtScopedCompanies, activeType, isDistrictView, baseTurnover: null });
  }, [resultRow, districtScopedCompanies, activeType, isDistrictView]);

  const hasSales = turnover.all > 0;
  const fShare = turnover.f30 != null ? turnover.f30 : 0;
  const types = useMemo(() => computeBusinessTypeTabs({ companies: districtScopedCompanies, isDistrictView, baseTypes: SAMARQAND_TYPES }), [districtScopedCompanies, isDistrictView]);

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

  const dailyBars = useMemo(() => {
    // Never paint mock SAMARQAND_DAYS over live API — empty until daily arrives.
    if (!dailyQuery.isSuccess) return [];
    return mapBackendDailyBars(dailyData?.days || dailyData || []);
  }, [dailyQuery.isSuccess, dailyData]);

  const topProducts = useMemo(() => {
    if (!productsQuery.isSuccess) return [];
    return mapBackendProductList(productsData?.topProducts || productsData?.top || []);
  }, [productsQuery.isSuccess, productsData?.topProducts, productsData?.top]);
  const lowProducts = useMemo(() => {
    if (!productsQuery.isSuccess) return [];
    return mapBackendProductList(productsData?.lowProducts || productsData?.bottom || []);
  }, [productsQuery.isSuccess, productsData?.lowProducts, productsData?.bottom]);

  const filteredDistricts = useMemo(() => {
    if (isDistrictView) {
      const inType = districtScopedCompanies.filter((c) => activeType === 'A' || c[4] === activeType);
      return calculateCompaniesBreakdown(inType, BUSINESS_TYPE_NAMES);
    }
    const inType = rawCompanies.filter((c) => activeType === 'A' || c[4] === activeType);
    return calculateDistrictsBreakdown(inType, districtNames);
  }, [isDistrictView, districtScopedCompanies, rawCompanies, activeType, districtNames]);

  const tableData = useMemo(() => {
    const res = filterAndPaginateCompanies(rawCompanies, {
      type: activeType, district: selectedDistrict, status: selectedStatus,
      query: searchQuery, page: currentPage, pageSize: 10,
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

  const rangeLabel = resultsData?.periodFrom && resultsData?.periodTo
    ? `${fmtDayShort(resultsData.periodFrom)} – ${fmtDayShort(resultsData.periodTo)}`
    : '10-okt – 8-noy';

  return {
    padCode, regionName, districtCode, districtName, isDistrictView,
    activeType, setActiveType: (t) => { setActiveType(t); setCurrentPage(0); },
    types, meta, turnover, hasSales, fShare, dailyBars, fiscalRing, connRing,
    connPercent: connPct, currentTypeConfig, topProducts, lowProducts,
    districtsBreakdown: filteredDistricts, districtOptions, selectedDistrict,
    setSelectedDistrict: handleDistrictChange, onClearDistrict: () => handleDistrictChange('all'),
    selectedStatus,
    setSelectedStatus: (s) => {
      const val = typeof s === 'object' && s !== null ? s?.target?.value ?? s?.value ?? '' : s;
      setSelectedStatus(val);
      setCurrentPage(0);
    },
    searchQuery, setSearchQuery: (q) => { setSearchQuery(q); setCurrentPage(0); },
    tableData, rangeLabel,
    onPrevPage: () => setCurrentPage((p) => Math.max(0, p - 1)),
    onNextPage: () => setCurrentPage((p) => Math.min(tableData.totalPages - 1, p + 1)),
  };
}

export default useViloyatDetailAnalytics;
