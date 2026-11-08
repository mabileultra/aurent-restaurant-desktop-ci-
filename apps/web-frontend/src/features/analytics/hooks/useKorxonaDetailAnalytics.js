import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import {
  MAKON_MOBILE_INFO,
  MAKON_MOBILE_CARDS,
  MAKON_MOBILE_PRODUCTS,
  MAKON_MOBILE_RECEIPTS,
} from '../data/makonMobileMockData';
import {
  formatCompact,
  formatPercent,
  calculateDonutArc,
  prepareProductsList,
  prepareDayChips,
  filterDayReceipts,
  prepareReceiptDetail,
} from '../utils/korxonaDetailUtils';

export function useKorxonaDetailAnalytics(companyId, regionCode = '18') {
  const numId = Number(companyId || 103);
  const [productSort, setProductSort] = useState('sum');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedDay, setSelectedDay] = useState('2026-10-28');
  const [fiscalKind, setFiscalKind] = useState('all');
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('');

  const { data: apiDetail } = useQuery({
    queryKey: ['tax-analytics-company', numId],
    queryFn: () => analyticsApi.getCompany(numId, { period: '30d' }).then((r) => r.data),
    enabled: Boolean(numId),
    staleTime: 60_000,
  });

  const companyInfo = useMemo(() => {
    if (apiDetail?.name && numId !== 103) {
      return {
        ...MAKON_MOBILE_INFO,
        id: numId,
        name: apiDetail.name,
        legalName: apiDetail.legalName || apiDetail.name,
        tin: apiDetail.tin || '—',
        regionCode: String(regionCode).padStart(2, '0'),
        regionName: apiDetail.regionNameUz || apiDetail.regionNameRu || 'Samarqand viloyati',
        businessType: apiDetail.businessTypeName || 'Oziq-ovqat',
        isConnected: Boolean(apiDetail.connected),
      };
    }
    return MAKON_MOBILE_INFO;
  }, [apiDetail, numId, regionCode]);

  const cards = MAKON_MOBILE_CARDS;
  const donuts = useMemo(() => ([
    {
      label: 'Fiskal bilan urilgan',
      color: '#0E7C4F',
      pct: formatPercent(99.2),
      amount: `${formatCompact(508339000)} so‘m`,
      hint: '41 ta chek · QR-kod bilan',
      dash: calculateDonutArc(99.2),
      aria: 'Fiskal bilan urilgan: 99,2%, 508,3 mln so‘m',
    },
    {
      label: 'Fiskalsiz',
      color: '#EF4444',
      pct: formatPercent(0.8),
      amount: `${formatCompact(4100000)} so‘m`,
      hint: '2 ta chek · soliqqa yuborilmagan',
      dash: calculateDonutArc(0.8),
      aria: 'Fiskalsiz: 0,8%, 4,1 mln so‘m',
    },
  ]), []);

  const { products, totalCount: totalProductsCount } = useMemo(() => (
    prepareProductsList(MAKON_MOBILE_PRODUCTS, productSort, showAllProducts)
  ), [productSort, showAllProducts]);

  const dayChips = useMemo(() => prepareDayChips(MAKON_MOBILE_RECEIPTS), []);
  const dayIndex = Math.max(0, dayChips.findIndex((c) => c.date === selectedDay));
  const activeDay = dayChips[dayIndex] || dayChips[0];

  const {
    rows: dayReceipts,
    totalFiscal,
    totalNonFiscal,
    totalCount: dayTotalCount,
    dayTotal,
  } = useMemo(() => (
    filterDayReceipts(MAKON_MOBILE_RECEIPTS, activeDay?.date || selectedDay, fiscalKind)
  ), [activeDay, selectedDay, fiscalKind]);

  const activeReceiptRow = useMemo(() => {
    if (selectedReceiptNo) {
      const found = dayReceipts.find((r) => r[0] === selectedReceiptNo);
      if (found) return found;
    }
    return dayReceipts[0] || null;
  }, [dayReceipts, selectedReceiptNo]);

  const receiptDetail = useMemo(() => (
    prepareReceiptDetail(activeReceiptRow)
  ), [activeReceiptRow]);

  const onPrevDay = () => {
    if (dayIndex > 0) {
      setSelectedDay(dayChips[dayIndex - 1].date);
      setSelectedReceiptNo('');
    }
  };

  const onNextDay = () => {
    if (dayIndex < dayChips.length - 1) {
      setSelectedDay(dayChips[dayIndex + 1].date);
      setSelectedReceiptNo('');
    }
  };

  return {
    companyInfo,
    cards,
    donuts,
    products,
    totalProductsCount,
    productSort,
    setProductSort,
    showAllProducts,
    toggleShowAllProducts: () => setShowAllProducts((prev) => !prev),
    dayChips,
    selectedDay: activeDay?.date,
    selectedDayLongLabel: activeDay?.longLabel,
    dayIndex,
    hasPrevDay: dayIndex > 0,
    hasNextDay: dayIndex < dayChips.length - 1,
    onPrevDay,
    onNextDay,
    onSelectDay: (d) => { setSelectedDay(d); setSelectedReceiptNo(''); },
    fiscalKind,
    setFiscalKind: (k) => { setFiscalKind(k); setSelectedReceiptNo(''); },
    dayReceipts,
    totalFiscal,
    totalNonFiscal,
    dayTotalCount,
    dayTotal,
    dayTotalFormatted: `${formatCompact(dayTotal)} so‘m`,
    selectedReceiptNo: activeReceiptRow ? activeReceiptRow[0] : '',
    onSelectReceipt: (no) => setSelectedReceiptNo(no),
    receiptDetail,
  };
}
