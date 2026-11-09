import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import { companyApi } from '../../../api/company.api';
import { SAMARQAND_COMPANIES, SAMARQAND_DISTRICTS } from '../data/samarqandMockData';
import {
  formatNumber, parseDayLabels, prepareProductsList,
  prepareDayChips, filterDayReceipts, prepareReceiptDetail,
} from '../utils/korxonaDetailUtils';
import {
  resolveCompanyInfo, resolveCompanyCards, resolveCompanyDonuts,
  resolveCompanyProducts, resolveCompanyReceipts,
} from '../utils/korxonaCompanyResolver';

export function useKorxonaDetailAnalytics(companyId, regionCode = '18') {
  const numId = Number(companyId || 103);
  const [productSort, setProductSort] = useState('sum');
  const [productPage, setProductPage] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedDay, setSelectedDay] = useState('2026-10-28');
  const [fiscalKind, setFiscalKind] = useState('all');
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('');

  useEffect(() => { setProductPage(0); }, [productSort, numId]);

  const { data: realCompany } = useQuery({
    queryKey: ['company-by-id', numId],
    queryFn: () => companyApi.getById(numId).then((r) => r.data).catch(() => null),
    enabled: Boolean(numId),
    staleTime: 120_000,
  });

  const { data: apiDetail } = useQuery({
    queryKey: ['tax-analytics-company', numId],
    queryFn: () => analyticsApi.getCompanyDetail(numId, { period: '30d' }).then((r) => r.data),
    enabled: Boolean(numId),
    staleTime: 60_000,
  });

  const companyInfo = useMemo(
    () => resolveCompanyInfo({ numId, apiDetail, realCompany, regionCode, districtNames: SAMARQAND_DISTRICTS }),
    [numId, apiDetail, realCompany, regionCode]
  );

  const mockComp = useMemo(() => SAMARQAND_COMPANIES.find((c) => c[0] === numId), [numId]);
  const turnover = Number(apiDetail?.totalTurnover ?? mockComp?.[7] ?? 0);
  const delta = apiDetail?.weekDeltaPct ?? mockComp?.[8] ?? null;
  const cards = useMemo(() => resolveCompanyCards({ numId, turnover, delta, apiDetail }), [numId, turnover, delta, apiDetail]);
  const donuts = useMemo(() => resolveCompanyDonuts({
    numId, turnover, fiscalTurnover: apiDetail?.fiscalTurnover,
    nonFiscalTurnover: apiDetail?.nonFiscalTurnover, apiDetail,
  }), [numId, turnover, apiDetail]);

  const rawProducts = useMemo(() => resolveCompanyProducts({ numId, companyName: companyInfo.name, apiDetail }), [numId, companyInfo.name, apiDetail]);
  const fallbackReceipts = useMemo(
    () => resolveCompanyReceipts({ numId, companyName: companyInfo.name, products: rawProducts }),
    [numId, companyInfo.name, rawProducts]
  );
  const { products, totalCount: totalProductsCount, from: productFrom, to: productTo, totalPages: productTotalPages } = useMemo(
    () => prepareProductsList(rawProducts, productSort, showAllProducts ? true : productPage, 10),
    [rawProducts, productSort, showAllProducts, productPage]
  );

  const dayChips = useMemo(() => {
    const rawDays = apiDetail?.days;
    if (Array.isArray(rawDays)) {
      return rawDays
        .filter((d) => Number(d.totalTurnover || 0) > 0)
        .map((d) => {
          const tot = Number(d.totalTurnover || 0);
          const { short, long } = parseDayLabels(d.date);
          return {
            date: d.date,
            label: short,
            shortLabel: short,
            longLabel: long,
            sub: `${formatNumber(tot)} so‘m`,
            subText: `${formatNumber(tot)} so‘m`,
            totalAmount: tot,
            hasPending: Number(d.nonFiscalTurnover || 0) > 0,
          };
        });
    }
    return prepareDayChips(fallbackReceipts);
  }, [apiDetail?.days, fallbackReceipts]);

  useEffect(() => {
    if (dayChips.length > 0 && (!selectedDay || !dayChips.some((c) => c.date === selectedDay))) {
      setSelectedDay(dayChips[dayChips.length - 1].date);
    }
  }, [dayChips, selectedDay]);

  const activeDay = dayChips.find((c) => c.date === selectedDay) || dayChips[0];
  const queryDay = activeDay?.date || null;

  const { data: receiptsData } = useQuery({
    queryKey: ['tax-analytics-receipts', numId, queryDay],
    queryFn: () => analyticsApi.getCompanyReceipts(numId, {
      date: queryDay || undefined,
      kind: 'ALL',
      size: 100,
    }).then((r) => r.data).catch(() => null),
    enabled: Boolean(numId && queryDay),
    staleTime: 30_000,
  });

  const rawReceipts = useMemo(() => {
    if (receiptsData?.rows) {
      return resolveCompanyReceipts({ backendReceipts: receiptsData.rows });
    }
    if (Array.isArray(apiDetail?.days)) {
      return [];
    }
    return fallbackReceipts;
  }, [receiptsData?.rows, apiDetail?.days, fallbackReceipts]);
  const { rows: dayReceipts, totalFiscal, totalNonFiscal, dayTotalCount, dayTotal } = useMemo(
    () => filterDayReceipts(rawReceipts, queryDay, fiscalKind),
    [rawReceipts, queryDay, fiscalKind]
  );

  const activeReceiptRow = useMemo(() => {
    if (selectedReceiptNo) {
      const found = dayReceipts.find((r) => r[0] === selectedReceiptNo || r[11] === selectedReceiptNo);
      if (found) return found;
    }
    return dayReceipts[0] || null;
  }, [dayReceipts, selectedReceiptNo]);

  const activeSaleId = activeReceiptRow?.[11];
  const isValidSaleUuid = typeof activeSaleId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeSaleId.trim());
  const { data: receiptDetailData } = useQuery({
    queryKey: ['tax-analytics-receipt-detail', numId, activeSaleId],
    queryFn: () => analyticsApi.getCompanyReceiptDetail(numId, activeSaleId).then((r) => r.data).catch(() => null),
    enabled: Boolean(numId && isValidSaleUuid),
    staleTime: 60_000,
  });

  const receiptDetail = useMemo(
    () => prepareReceiptDetail(receiptDetailData || activeReceiptRow),
    [receiptDetailData, activeReceiptRow]
  );

  const dayIndex = Math.max(0, dayChips.findIndex((c) => c.date === queryDay));

  const detailReceiptCount = Number(
    apiDetail?.totalReceiptsCount
      ?? ((apiDetail?.fiscalReceiptsCount ?? apiDetail?.fiscalReceiptCount ?? 0)
        + (apiDetail?.nonFiscalReceiptsCount ?? apiDetail?.nonFiscalReceiptCount ?? 0))
  );
  const averageCheck = apiDetail?.avgReceiptAmount != null
    ? Number(apiDetail.avgReceiptAmount)
    : (apiDetail?.averageCheck != null ? Number(apiDetail.averageCheck) : null);

  return {
    companyInfo, cards, donuts, products, totalProductsCount,
    productPage, productFrom, productTo, productTotalPages,
    onPrevProductPage: () => setProductPage((p) => Math.max(0, p - 1)),
    onNextProductPage: () => setProductPage((p) => Math.min(productTotalPages - 1, p + 1)),
    setProductPage, productSort, setProductSort, showAllProducts,
    toggleShowAllProducts: () => setShowAllProducts((prev) => !prev),
    dayChips, selectedDay: queryDay, selectedDayLongLabel: activeDay?.longLabel,
    dayIndex, hasPrevDay: dayIndex > 0, hasNextDay: dayIndex < dayChips.length - 1,
    onPrevDay: () => { if (dayIndex > 0) { setSelectedDay(dayChips[dayIndex - 1].date); setSelectedReceiptNo(''); } },
    onNextDay: () => { if (dayIndex < dayChips.length - 1) { setSelectedDay(dayChips[dayIndex + 1].date); setSelectedReceiptNo(''); } },
    onSelectDay: (d) => { setSelectedDay(d); setSelectedReceiptNo(''); },
    fiscalKind, setFiscalKind: (k) => { setFiscalKind(k); setSelectedReceiptNo(''); },
    dayReceipts, totalFiscal, totalNonFiscal, dayTotalCount, dayTotal,
    dayTotalFormatted: `${formatNumber(dayTotal)} so‘m`,
    // Prefer detail COUNT from backend — avoid waiting on /receipts list for header KPI.
    totalReceiptsCount: detailReceiptCount || receiptsData?.totalElements || dayTotalCount,
    averageCheck,
    selectedReceiptNo: activeReceiptRow ? activeReceiptRow[0] : '',
    onSelectReceipt: (no) => setSelectedReceiptNo(no),
    receiptDetail,
  };
}

export default useKorxonaDetailAnalytics;
