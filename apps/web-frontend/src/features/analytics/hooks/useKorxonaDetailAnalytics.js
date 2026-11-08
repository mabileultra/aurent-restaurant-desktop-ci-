import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { SAMARQAND_COMPANIES, SAMARQAND_DISTRICTS } from '../data/samarqandMockData';
import {
  formatCompact,
  prepareProductsList,
  prepareDayChips,
  filterDayReceipts,
  prepareReceiptDetail,
} from '../utils/korxonaDetailUtils';
import {
  resolveCompanyInfo,
  resolveCompanyCards,
  resolveCompanyDonuts,
  resolveCompanyProducts,
  resolveCompanyReceipts,
} from '../utils/korxonaCompanyResolver';

export function useKorxonaDetailAnalytics(companyId, regionCode = '18') {
  const numId = Number(companyId || 103);
  const [productSort, setProductSort] = useState('sum');
  const [productPage, setProductPage] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedDay, setSelectedDay] = useState('2026-10-28');
  const [fiscalKind, setFiscalKind] = useState('all');
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('');

  useEffect(() => {
    setProductPage(0);
  }, [productSort, numId]);

  const { data: apiDetail } = useQuery({
    queryKey: ['tax-analytics-company', numId],
    queryFn: () => analyticsApi.getCompanyDetail(numId, { period: '30d' }).then((r) => r.data),
    enabled: Boolean(numId),
    staleTime: 60_000,
  });

  const companyInfo = useMemo(
    () => resolveCompanyInfo({ numId, apiDetail, regionCode, districtNames: SAMARQAND_DISTRICTS }),
    [numId, apiDetail, regionCode]
  );

  const mockComp = useMemo(() => SAMARQAND_COMPANIES.find((c) => c[0] === numId), [numId]);
  const turnover = Number(apiDetail?.totalTurnover ?? mockComp?.[7] ?? 512439000);
  const delta = apiDetail?.weekDeltaPct ?? mockComp?.[8] ?? null;

  const cards = useMemo(
    () => resolveCompanyCards({ numId, turnover, delta, apiDetail }),
    [numId, turnover, delta, apiDetail]
  );

  const donuts = useMemo(
    () => resolveCompanyDonuts({
      numId,
      turnover,
      fiscalTurnover: apiDetail?.fiscalTurnover,
      nonFiscalTurnover: apiDetail?.nonFiscalTurnover,
      apiDetail,
    }),
    [numId, turnover, apiDetail]
  );

  const rawProducts = useMemo(
    () => resolveCompanyProducts({ numId, companyName: companyInfo.name, apiDetail }),
    [numId, companyInfo.name, apiDetail]
  );

  const {
    products,
    totalCount: totalProductsCount,
    from: productFrom,
    to: productTo,
    totalPages: productTotalPages,
  } = useMemo(() => (
    prepareProductsList(rawProducts, productSort, showAllProducts ? true : productPage, 10)
  ), [rawProducts, productSort, showAllProducts, productPage]);

  const onPrevProductPage = () => {
    setProductPage((p) => Math.max(0, p - 1));
  };

  const onNextProductPage = () => {
    setProductPage((p) => Math.min(productTotalPages - 1, p + 1));
  };

  const rawReceipts = useMemo(
    () => resolveCompanyReceipts({ numId, companyName: companyInfo.name, products: rawProducts }),
    [numId, companyInfo.name, rawProducts]
  );

  const dayChips = useMemo(() => prepareDayChips(rawReceipts), [rawReceipts]);
  const dayIndex = Math.max(0, dayChips.findIndex((c) => c.date === selectedDay));
  const activeDay = dayChips[dayIndex] || dayChips[0];

  const {
    rows: dayReceipts,
    totalFiscal,
    totalNonFiscal,
    totalCount: dayTotalCount,
    dayTotal,
  } = useMemo(() => (
    filterDayReceipts(rawReceipts, activeDay?.date || selectedDay, fiscalKind)
  ), [rawReceipts, activeDay, selectedDay, fiscalKind]);

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
    productPage,
    productFrom,
    productTo,
    productTotalPages,
    onPrevProductPage,
    onNextProductPage,
    setProductPage,
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
