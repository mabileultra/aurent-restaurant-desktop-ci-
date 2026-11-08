import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { geoApi } from '../../../api/geo.api';
import { analyticsApi } from '../api/analyticsApi';
import {
  SAMARQAND_TYPES,
  SAMARQAND_META,
  SAMARQAND_TURNOVER,
  SAMARQAND_DAYS,
  SAMARQAND_PRODUCTS,
  SAMARQAND_COMPANIES,
  SAMARQAND_DISTRICTS,
  BUSINESS_TYPE_NAMES,
} from '../data/samarqandMockData';
import {
  formatCompact,
  formatPercent,
  calculateRingDash,
  calculateDeltaBadge,
  calculateDistrictsBreakdown,
  filterAndPaginateCompanies,
} from '../utils/viloyatDetailUtils';

export function useViloyatDetailAnalytics(regionCode) {
  const padCode = String(regionCode || '18').padStart(2, '0');
  const [activeType, setActiveType] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);

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

  const currentRegion = regions.find((r) => String(r.code).padStart(2, '0') === padCode);
  const regionName = currentRegion?.nameUz || currentRegion?.nameRu || (padCode === '18' ? 'Samarqand viloyati' : `Viloyat (${padCode})`);

  const districtNames = useMemo(() => {
    const map = { ...SAMARQAND_DISTRICTS };
    geoDistricts.forEach((d) => {
      const code = String(d.code || '').padStart(2, '0');
      map[code] = d.nameUz || d.nameRu || code;
    });
    return map;
  }, [geoDistricts]);

  const districtOptions = useMemo(() => {
    const list = [{ value: 'all', label: 'Barcha tumanlar' }];
    Object.entries(districtNames).forEach(([code, name]) => {
      list.push({ value: code, label: name });
    });
    return list;
  }, [districtNames]);

  const rawCompanies = SAMARQAND_COMPANIES;
  const currentMeta = SAMARQAND_META[activeType] || SAMARQAND_META.A;
  const turnover = SAMARQAND_TURNOVER[activeType] || SAMARQAND_TURNOVER.A;
  const hasSales = turnover.all > 0;
  const fShare = hasSales ? (turnover.allF / turnover.all) * 100 : 0;

  const maxDay = Math.max(...SAMARQAND_DAYS);
  const monthNames = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  const dailyBars = SAMARQAND_DAYS.map((val, idx) => {
    const d = new Date(2026, 9, 10 + idx);
    const dayLabel = `${d.getDate()}-${monthNames[d.getMonth()]}`;
    const tip = val ? `${dayLabel}: ${val.toLocaleString('ru-RU')} mln so‘m` : `${dayLabel}: savdo yo‘q`;
    const heightPercent = val ? Math.max(6, (val / maxDay) * 100) : 4;
    return { tip, heightPercent, val };
  });

  const currentTypeConfig = SAMARQAND_TYPES.find((t) => t.id === activeType) || SAMARQAND_TYPES[0];
  const connPct = (currentTypeConfig.c / currentTypeConfig.n) * 100;
  const fiscalRing = calculateRingDash(turnover.f30);
  const connRing = calculateRingDash(connPct);

  const productGroup = SAMARQAND_PRODUCTS[activeType] || { top: [], low: [] };
  const topMax = productGroup.top.length ? productGroup.top[0][3] : 1;
  const mapProd = (p, idx) => ({
    rank: idx + 1,
    name: p[0],
    company: p[1],
    qty: p[2],
    amount: p[3],
    barPercent: Math.max(3, (p[3] / topMax) * 100),
    isSuspiciousPrice: p[3] / p[2] < 100,
    unitPrice: Math.round(p[3] / p[2]),
  });

  const topProducts = productGroup.top.map(mapProd);
  const lowProducts = productGroup.low.map(mapProd);

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

    const rows = res.rows.map((comp, idx) => {
      const deltaObj = calculateDeltaBadge(comp[8]);
      return {
        rowNumber: res.from + idx,
        id: comp[0],
        name: comp[1],
        tin: comp[2] && comp[2] !== '_' ? comp[2] : '—',
        district: districtNames[comp[3]] || comp[3] || '—',
        type: BUSINESS_TYPE_NAMES[comp[4]] || comp[4],
        isConnected: comp[5] === 1,
        turnover30d: comp[7],
        deltaText: deltaObj ? deltaObj.text : '—',
        isDeltaUp: deltaObj ? deltaObj.isUp : null,
      };
    });

    return { ...res, rows };
  }, [rawCompanies, activeType, selectedDistrict, selectedStatus, searchQuery, currentPage, districtNames]);

  return {
    padCode,
    regionName,
    activeType,
    setActiveType: (t) => { setActiveType(t); setCurrentPage(0); },
    types: SAMARQAND_TYPES,
    meta: currentMeta,
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
    setSelectedDistrict: (d) => { setSelectedDistrict(d); setCurrentPage(0); },
    selectedStatus,
    setSelectedStatus: (s) => { setSelectedStatus(s); setCurrentPage(0); },
    searchQuery,
    setSearchQuery: (q) => { setSearchQuery(q); setCurrentPage(0); },
    tableData,
    onPrevPage: () => setCurrentPage((p) => Math.max(0, p - 1)),
    onNextPage: () => setCurrentPage((p) => Math.min(tableData.totalPages - 1, p + 1)),
  };
}
