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
import { formatCompact, formatPercent, calculateDonutArc } from './korxonaDetailUtils';

function createMonogram(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'K';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function resolveCompanyInfo({ numId, apiDetail, regionCode = '18', districtNames = {} }) {
  if (apiDetail && apiDetail.name) {
    const name = apiDetail.name;
    const dCode = apiDetail.districtCode || '';
    return {
      ...MAKON_MOBILE_INFO,
      id: numId,
      name,
      monogram: createMonogram(name),
      legalName: apiDetail.legalName || name,
      tin: apiDetail.tin || '—',
      regionCode: String(regionCode).padStart(2, '0'),
      regionName: apiDetail.regionNameUz || apiDetail.regionNameRu || 'Samarqand viloyati',
      districtName: apiDetail.districtNameUz || districtNames[dCode] || 'Samarqand sh.',
      businessType: apiDetail.businessTypeName || 'Oziq-ovqat',
      isConnected: Boolean(apiDetail.connected),
      storeName: name,
      address: `${districtNames[dCode] || 'Samarqand sh.'}, O‘zbekiston`,
    };
  }

  if (numId === 103) {
    return MAKON_MOBILE_INFO;
  }

  const mock = SAMARQAND_COMPANIES.find((c) => c[0] === numId);
  if (mock) {
    const name = mock[1];
    const dCode = mock[3];
    return {
      ...MAKON_MOBILE_INFO,
      id: numId,
      name,
      monogram: createMonogram(name),
      legalName: `${name} MCHJ`,
      tin: mock[2] && mock[2] !== '_' ? mock[2] : '—',
      regionCode: String(regionCode).padStart(2, '0'),
      regionName: 'Samarqand viloyati',
      districtName: districtNames[dCode] || 'Samarqand sh.',
      businessType: BUSINESS_TYPE_NAMES[mock[4]] || 'Boshqa',
      isConnected: mock[5] === 1,
      storeName: name,
      address: `${districtNames[dCode] || 'Samarqand sh.'}, O‘zbekiston`,
    };
  }

  return {
    ...MAKON_MOBILE_INFO,
    id: numId,
    name: `Korxona #${numId}`,
    monogram: 'K',
    legalName: `Korxona #${numId}`,
    tin: '—',
    regionCode: String(regionCode).padStart(2, '0'),
  };
}

export function resolveCompanyCards({ numId, turnover, delta, apiDetail }) {
  if (numId === 103 && !apiDetail) {
    return MAKON_MOBILE_CARDS;
  }

  const t = Number(turnover || 0);
  const weekVal = Math.round(t * 0.15);
  return [
    { label: 'Umumiy aylanma', sub: 'Butun davr', v: t, badge: 'Birinchi savdo: 20-oktabr', badgeType: 'mute' },
    { label: '1 oylik aylanma', sub: 'Oxirgi 30 kun · 10-okt – 8-noy', v: t, badge: '30 kunlik', badgeType: 'info' },
    {
      label: 'Haftalik',
      sub: 'Oxirgi 7 kun · 2 – 8-noy',
      v: weekVal,
      badge: delta != null ? `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%` : '7 kunlik',
      badgeType: delta != null && delta < 0 ? 'down' : 'up',
    },
    { label: 'Kunlik', sub: 'Bugun · 8-noyabr', v: 0, badge: 'Oxirgi savdo: 2-noyabr', badgeType: 'mute' },
  ];
}

export function resolveCompanyDonuts({ numId, turnover, fiscalTurnover, nonFiscalTurnover, apiDetail }) {
  if (numId === 103 && !apiDetail) {
    return [
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
    ];
  }

  const t = Number(turnover || 0);
  const f = fiscalTurnover != null ? Number(fiscalTurnover) : Math.round(t * 0.98);
  const nf = nonFiscalTurnover != null ? Number(nonFiscalTurnover) : Math.max(0, t - f);
  const fPct = t > 0 ? (f / t) * 100 : 98.0;
  const nfPct = Math.max(0, 100 - fPct);

  return [
    {
      label: 'Fiskal bilan urilgan',
      color: '#0E7C4F',
      pct: formatPercent(fPct),
      amount: `${formatCompact(f)} so‘m`,
      hint: 'QR-kod bilan',
      dash: calculateDonutArc(fPct),
      aria: `Fiskal bilan urilgan: ${formatPercent(fPct)}, ${formatCompact(f)} so‘m`,
    },
    {
      label: 'Fiskalsiz',
      color: '#EF4444',
      pct: formatPercent(nfPct),
      amount: `${formatCompact(nf)} so‘m`,
      hint: 'Soliqqa yuborilmagan',
      dash: calculateDonutArc(nfPct),
      aria: `Fiskalsiz: ${formatPercent(nfPct)}, ${formatCompact(nf)} so‘m`,
    },
  ];
}

export function resolveCompanyProducts({ numId, companyName, apiDetail }) {
  if (numId === 103 && !apiDetail) {
    return MAKON_MOBILE_PRODUCTS;
  }

  if (apiDetail?.topProducts && apiDetail.topProducts.length > 0) {
    return apiDetail.topProducts.map((p) => [p.name, Number(p.qty || 1), Number(p.totalTurnover || 0)]);
  }

  const all = [...(SAMARQAND_PRODUCTS.A?.top || []), ...(SAMARQAND_PRODUCTS.O?.top || [])];
  const matched = all.filter((p) => p[1] === companyName).map((p) => [p[0], p[2], p[3]]);
  if (matched.length > 0) return matched;

  return [
    [`${companyName} asosiy mahsulot №1`, 120, 25000000],
    [`${companyName} mahsulot №2`, 85, 18000000],
    [`${companyName} mahsulot №3`, 40, 9500000],
  ];
}

export function resolveCompanyReceipts({ numId, companyName, products = [] }) {
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
