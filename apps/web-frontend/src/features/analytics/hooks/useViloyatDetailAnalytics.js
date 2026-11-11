import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useViloyatDetailQueries } from './useViloyatDetailQueries';
import { SAMARQAND_TYPES, SAMARQAND_COMPANIES, SAMARQAND_DISTRICTS, BUSINESS_TYPE_NAMES } from '../data/samarqandMockData';
import { calculateRingDash, calculateDistrictsBreakdown, filterAndPaginateCompanies, mapDistrictNames } from '../utils/viloyatDetailUtils';
import {
  normalizeBackendCompany,
  computeDistrictTurnover,
  computeBusinessTypeTabs,
  resolveDistrictMeta,
  buildDistrictOptions,
  mapBackendProductList,
  mapBackendDailyBars,
  calculateCompaniesBreakdown,
} from '../utils/viloyatDetailStats';

export function useViloyatDetailAnalytics(regionCode) {
  const [searchParams, setSearchParams] = useSearchParams();
  const districtQuery = searchParams.get('district');
  const districtCode = districtQuery ? String(districtQuery).padStart(2, '0') : null;
  const isDistrictView = Boolean(districtCode);

  const [activeType, setActiveType] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);

  const padCode = String(regionCode || '18').padStart(2, '0');
  const backendDistrictCode = districtCode ? (districtCode.length <= 2 ? `${padCode}${districtCode}` : districtCode) : undefined;

  const {
    regions, geoDistricts, backendCompaniesData,
    resultsQuery, resultsData, dailyQuery, dailyData, productsQuery, productsData,
  } = useViloyatDetailQueries({ padCode, backendDistrictCode, districtCode });

  const currentRegion = regions.find((r) => String(r.code).padStart(2, '0') === padCode);
  const regionName = currentRegion?.nameUz || currentRegion?.nameRu || (padCode === '18' ? 'Samarqand viloyati' : `Viloyat (${padCode})`);

  const districtNames = useMemo(() => mapDistrictNames(geoDistricts, SAMARQAND_DISTRICTS), [geoDistricts]);

  const districtName = districtCode
    ? (districtNames[districtCode] || districtNames[districtCode.slice(-2)] || districtNames[`${padCode}${districtCode}`] || `Tuman #${districtCode}`)
    : null;

  const allCompanies = useMemo(() => {
    if (Array.isArray(backendCompaniesData?.rows)) {
      return backendCompaniesData.rows.map(normalizeBackendCompany).filter(Boolean);
    }
    return [];
  }, [backendCompaniesData?.rows]);

  const districtScopedCompanies = useMemo(() => {
    if (!isDistrictView) return allCompanies;
    const target = String(districtCode || '').slice(-2);
    return allCompanies.filter((c) => String(c[3] || '').slice(-2) === target);
  }, [allCompanies, isDistrictView, districtCode]);

  const turnover = useMemo(() => {
    const resultRow = resultsData?.rows?.[0];
    if (resultRow) {
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
    return computeDistrictTurnover(districtScopedCompanies);
  }, [districtScopedCompanies, resultsData]);

  const types = useMemo(
    () => computeBusinessTypeTabs(districtScopedCompanies, SAMARQAND_TYPES, turnover.all, activeType),
    [districtScopedCompanies, turnover.all, activeType]
  );

  const currentTypeConfig = types.find((t) => t.id === activeType) || types[0] || { n: 0, c: 0 };
  const connPct = currentTypeConfig.n > 0 ? (currentTypeConfig.c / currentTypeConfig.n) * 100 : 0;
  const fiscalRing = calculateRingDash(turnover.f30);
  const connRing = calculateRingDash(connPct);

  const districtsBreakdown = useMemo(() => {
    if (isDistrictView) {
      return calculateCompaniesBreakdown(districtScopedCompanies, BUSINESS_TYPE_NAMES);
    }
    return calculateDistrictsBreakdown(districtScopedCompanies, districtNames);
  }, [isDistrictView, districtScopedCompanies, districtNames]);

  const dailyBars = useMemo(() => {
    if (!dailyQuery?.isSuccess) return [];
    return mapBackendDailyBars(dailyData?.days || dailyData || []);
  }, [dailyQuery?.isSuccess, dailyData]);

  const topProducts = useMemo(() => {
    if (!productsQuery?.isSuccess) return [];
    return mapBackendProductList(productsData?.topProducts || productsData?.top || []);
  }, [productsQuery?.isSuccess, productsData?.topProducts, productsData?.top]);

  const lowProducts = useMemo(() => {
    if (!productsQuery?.isSuccess) return [];
    return mapBackendProductList(productsData?.lowProducts || productsData?.bottom || []);
  }, [productsQuery?.isSuccess, productsData?.lowProducts, productsData?.bottom]);

  const filteredDistricts = useMemo(() => {
    if (isDistrictView) {
      return districtsBreakdown.districts.slice(0, 5);
    }
    return districtsBreakdown.districts.filter((d) => d.turnover > 0).slice(0, 5);
  }, [isDistrictView, districtsBreakdown.districts]);

  const districtOptions = useMemo(() => buildDistrictOptions(districtNames), [districtNames]);

  const tableData = useMemo(() => {
    return filterAndPaginateCompanies(districtScopedCompanies, {
      type: activeType,
      status: selectedStatus,
      search: searchQuery,
      page: currentPage,
      pageSize: 10,
    });
  }, [districtScopedCompanies, activeType, selectedStatus, searchQuery, currentPage]);

  const hasSales = turnover.all > 0;
  const fShare = turnover.f30 != null ? turnover.f30 : 0;
  const meta = resolveDistrictMeta({
    isDistrictView,
    totalCount: districtScopedCompanies.length,
    connectedCount: districtScopedCompanies.filter((c) => c[5] === 1).length,
    totalDistricts: Object.keys(districtNames).length,
  });

  const handleDistrictChange = (code) => {
    if (!code || code === 'all') {
      searchParams.delete('district');
    } else {
      searchParams.set('district', code);
    }
    setSearchParams(searchParams);
    setCurrentPage(0);
  };

  return {
    padCode, regionName, districtCode, districtName, isDistrictView,
    activeType, setActiveType: (t) => { setActiveType(t); setCurrentPage(0); },
    types, meta, turnover, hasSales, fShare, dailyBars, fiscalRing, connRing,
    connPercent: connPct, currentTypeConfig, topProducts, lowProducts,
    districtsBreakdown, filteredDistricts, districtOptions,
    selectedDistrict: districtCode || 'all',
    setSelectedDistrict: handleDistrictChange,
    onDistrictChange: handleDistrictChange,
    onClearDistrict: () => handleDistrictChange('all'),
    selectedStatus,
    setSelectedStatus: (s) => {
      const val = typeof s === 'object' && s !== null ? s?.target?.value ?? s?.value ?? '' : s;
      setSelectedStatus(val);
      setCurrentPage(0);
    },
    searchQuery, setSearchQuery: (q) => { setSearchQuery(q); setCurrentPage(0); },
    searchTerm: searchQuery, setSearchTerm: (q) => { setSearchQuery(q); setCurrentPage(0); },
    currentPage, setCurrentPage, tableData, rangeLabel: '10-okt – 8-noy',
    onPrevPage: () => setCurrentPage((p) => Math.max(0, p - 1)),
    onNextPage: () => setCurrentPage((p) => Math.min((tableData?.totalPages || 1) - 1, p + 1)),
  };
}

export default useViloyatDetailAnalytics;
