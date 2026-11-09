import {
  MAKON_MOBILE_INFO,
  MAKON_MOBILE_CARDS,
  MAKON_MOBILE_PRODUCTS,
  MAKON_MOBILE_RECEIPTS,
} from '../data/makonMobileMockData';
import {
  SAMARQAND_COMPANIES,
  SAMARQAND_PRODUCTS,
  BUSINESS_TYPE_NAMES,
} from '../data/samarqandMockData';
import { formatNumber, formatPercent, calculateDonutArc, parseDayLabels } from './korxonaDetailUtils';

function createMonogram(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'K';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function resolveCompanyInfo({ numId, apiDetail, realCompany, regionCode = '18', districtNames = {} }) {
  if (numId === 103 && !apiDetail && !realCompany) {
    return MAKON_MOBILE_INFO;
  }
  const mock = SAMARQAND_COMPANIES.find((c) => c[0] === numId);
  const name = realCompany?.name || apiDetail?.name || mock?.[1] || (numId === 103 ? 'Makon Mobile' : `Korxona #${numId}`);
  const dCode = realCompany?.districtCode || apiDetail?.districtCode || mock?.[3] || '';
  const districtName = apiDetail?.districtNameUz || districtNames[dCode] || 'Samarqand sh.';
  const regionName = apiDetail?.regionNameUz || apiDetail?.regionNameRu || 'Samarqand viloyati';
  const tin = realCompany?.tin || apiDetail?.tin || (mock?.[2] && mock[2] !== '_' ? mock[2] : (numId === 103 ? '309121333' : '—'));
  const businessType = realCompany?.businessType || apiDetail?.businessTypeName || (mock?.[4] ? (BUSINESS_TYPE_NAMES[mock[4]] || 'Boshqa') : (numId === 103 ? 'Oziq-ovqat' : 'Boshqa'));

  return {
    id: numId,
    name,
    monogram: createMonogram(name),
    legalName: realCompany?.legalName || apiDetail?.legalName || `${name} MCHJ`,
    tin,
    regionCode: String(realCompany?.regionCode || regionCode).padStart(2, '0'),
    regionName,
    districtName,
    businessType,
    isConnected: Boolean(realCompany?.active ?? apiDetail?.connected ?? (mock ? mock[5] === 1 : (numId === 103))),
    storeName: name,
    storeCount: realCompany?.storeCount || apiDetail?.storeCount || 1,
    storesCount: realCompany?.storeCount || apiDetail?.storeCount || 1,
    phone: realCompany?.phone || (numId === 103 ? '+998 88 934 44 44' : '—'),
    address: realCompany?.address || (numId === 103 ? 'Samarqand sh., Makon Mall' : `${districtName}, O‘zbekiston`),
    fiscalModule: '—',
  };
}

export function resolveCompanyCards({ numId, turnover, delta, apiDetail }) {
  if (numId === 103 && !apiDetail) {
    return MAKON_MOBILE_CARDS;
  }

  const t = Number(turnover || apiDetail?.totalTurnover || 0);
  const weeks = apiDetail?.weeks;
  const lastWeek = Array.isArray(weeks) && weeks.length > 0 ? weeks[weeks.length - 1] : null;
  const weekVal = lastWeek ? Number(lastWeek.totalTurnover || 0) : Math.round(t * 0.15);
  const weekDelta = lastWeek?.deltaPct != null ? Number(lastWeek.deltaPct) : delta;

  const rawDays = apiDetail?.days;
  const sortedDays = Array.isArray(rawDays) ? [...rawDays].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const activeDays = sortedDays.filter((d) => Number(d.totalTurnover || 0) > 0);
  const oldestActive = activeDays[0];
  const latestActive = activeDays[activeDays.length - 1];

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayEntry = sortedDays.find((d) => d.date === todayIso);
  const todayVal = Number(todayEntry?.totalTurnover || 0);

  let weekSub = 'Oxirgi 7 kun';
  let weekBadge = weekDelta != null ? `${weekDelta >= 0 ? '▲' : '▼'} ${Math.abs(weekDelta)}%` : '7 kunlik';
  let weekBadgeType = weekDelta != null && weekDelta < 0 ? 'down' : 'up';
  if (lastWeek?.weekFrom) {
    const fStr = parseDayLabels(lastWeek.weekFrom).short;
    const tStr = parseDayLabels(lastWeek.weekTo).short;
    if (lastWeek.weekFrom === lastWeek.weekTo) {
      weekSub = `Joriy hafta · ${fStr}`;
      if (weekVal === 0) { weekBadge = 'Yangi hafta'; weekBadgeType = 'mute'; }
    } else {
      weekSub = `${fStr} – ${tStr}`;
    }
  }

  const daySub = `Bugun · ${parseDayLabels(todayIso).short || todayIso}`;
  const dayBadge = todayVal > 0
    ? 'Bugungi savdo'
    : (latestActive ? `Oxirgi savdo: ${parseDayLabels(latestActive.date).short}` : (apiDetail ? 'Savdo yo‘q' : 'Oxirgi savdo: 2-noyabr'));
  const dayBadgeType = todayVal > 0 ? 'up' : 'mute';

  const periodSub = apiDetail?.from && apiDetail?.to
    ? `Oxirgi 30 kun · ${parseDayLabels(apiDetail.from).short} – ${parseDayLabels(apiDetail.to).short}`
    : 'Oxirgi 30 kun';
  const firstSaleBadge = oldestActive
    ? `Ilk savdo: ${parseDayLabels(oldestActive.date).short}`
    : (apiDetail ? '30 kunlik' : 'Birinchi savdo: 20-oktabr');
  const monthBadge = activeDays.length > 0 ? `${activeDays.length} kun savdo` : '30 kunlik';

  return [
    { label: 'Umumiy aylanma', sub: 'Oxirgi 30 kun', v: t, badge: firstSaleBadge, badgeType: 'mute' },
    { label: '1 oylik aylanma', sub: periodSub, v: t, badge: monthBadge, badgeType: 'info' },
    { label: 'Haftalik', sub: weekSub, v: weekVal, badge: weekBadge, badgeType: weekBadgeType },
    { label: 'Kunlik', sub: daySub, v: todayVal, badge: dayBadge, badgeType: dayBadgeType },
  ];
}

export function resolveCompanyDonuts({ numId, turnover, fiscalTurnover, nonFiscalTurnover, apiDetail }) {
  const isMock103 = numId === 103 && !apiDetail;
  const t = isMock103 ? 512439000 : Number(turnover || apiDetail?.totalTurnover || 0);
  const f = isMock103 ? 508339000 : (fiscalTurnover != null ? Number(fiscalTurnover) : Number(apiDetail?.fiscalTurnover || 0));
  const nf = isMock103 ? 4100000 : (nonFiscalTurnover != null ? Number(nonFiscalTurnover) : Number(apiDetail?.nonFiscalTurnover || Math.max(0, t - f)));
  const total = f + nf > 0 ? f + nf : t;
  const fPct = total > 0 ? (f / total) * 100 : 0;
  const nfPct = Math.max(0, 100 - fPct);

  return [
    {
      label: 'Fiskal bilan urilgan',
      color: '#0E7C4F',
      pct: formatPercent(fPct),
      amount: `${formatNumber(f)} so‘m`,
      hint: isMock103 ? '41 ta chek · QR-kod bilan' : 'QR-kod bilan',
      dash: calculateDonutArc(fPct),
      aria: `Fiskal bilan urilgan: ${formatPercent(fPct)}, ${formatNumber(f)} so‘m`,
    },
    {
      label: 'Fiskalsiz',
      color: '#EF4444',
      pct: formatPercent(nfPct),
      amount: `${formatNumber(nf)} so‘m`,
      hint: isMock103 ? '2 ta chek · soliqqa yuborilmagan' : 'Soliqqa yuborilmagan',
      dash: calculateDonutArc(nfPct),
      aria: `Fiskalsiz: ${formatPercent(nfPct)}, ${formatNumber(nf)} so‘m`,
    },
  ];
}

export function resolveCompanyProducts({ numId, companyName, apiDetail }) {
  if (apiDetail?.topProducts && Array.isArray(apiDetail.topProducts) && apiDetail.topProducts.length > 0) {
    return apiDetail.topProducts.map((p) => [
      p.name || 'Tovar',
      Number(p.quantity ?? p.qty ?? 1),
      Number(p.amount ?? p.totalAmount ?? p.totalTurnover ?? 0),
    ]);
  }

  if (numId === 103 && !apiDetail) {
    return MAKON_MOBILE_PRODUCTS;
  }

  const all = [...(SAMARQAND_PRODUCTS.A?.top || []), ...(SAMARQAND_PRODUCTS.O?.top || [])];
  const matched = all.filter((p) => p[1] === companyName).map((p) => [p[0], p[2], p[3]]);
  if (matched.length > 0) return matched;

  return [];
}

export function resolveCompanyReceipts({ numId, companyName, products = [], backendReceipts = null }) {
  if (Array.isArray(backendReceipts)) {
    return backendReceipts.map((r) => [
      r.receiptNumber || r.saleId || '—',
      r.createdAt ? r.createdAt.slice(0, 10) : '—',
      r.createdAt ? r.createdAt.slice(11, 16) : '—',
      Number(r.totalAmount || 0),
      0,
      Number(r.totalAmount || 0),
      r.paymentMethod || 'CASH',
      (r.hasQr || r.fiscalStatus === 'FISCALIZED') ? 1 : 0,
      null,
      null,
      [],
      r.saleId,
    ]);
  }

  if (numId === 103) {
    return MAKON_MOBILE_RECEIPTS;
  }

  const p1 = products[0] || ['Tovar №1', 1, 100000];
  const p2 = products[1] || ['Tovar №2', 1, 50000];

  return [
    ['RCP-20261028-0001', '2026-10-28', '14:20', p1[2], 0, p1[2], 'CASH', 1, '123456789012', '1001', [[p1[0], 1, p1[2]]]],
    ['RCP-20261028-0002', '2026-10-28', '16:45', p2[2], 0, p2[2], 'CASHLESS', 1, '123456789013', '1002', [[p2[0], 1, p2[2]]]],
    ['RCP-20261028-0003', '2026-10-28', '18:10', p1[2], 0, p1[2], 'CASH', 0, null, null, [[p1[0], 1, p1[2]]]],
  ];
}
