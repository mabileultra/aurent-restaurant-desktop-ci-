import {
  MAKON_MOBILE_INFO,
  MAKON_MOBILE_PRODUCTS,
  MAKON_MOBILE_RECEIPTS,
} from '../data/makonMobileMockData';
import {
  SAMARQAND_COMPANIES,
  SAMARQAND_PRODUCTS,
  BUSINESS_TYPE_NAMES,
} from '../data/samarqandMockData';
import { mapBusinessTypeTabCode } from './viloyatDetailStats';
export { resolveCompanyCards, resolveCompanyDonuts } from './korxonaMetricsResolver';

const BUSINESS_TYPE_LABELS = {
  F: 'Oziq-ovqat',
  G: 'Oziq-ovqat',
  R: 'Restoran',
  P: 'Dorixona',
  O: 'Boshqa',
  GROCERY: 'Oziq-ovqat',
  RESTAURANT: 'Restoran',
  PHARMACY: 'Dorixona',
  UNIVERSAL: 'Boshqa',
};

function resolveBusinessTypeLabel(rawType, mockCode) {
  if (rawType) {
    const key = String(rawType).trim();
    if (BUSINESS_TYPE_LABELS[key]) return BUSINESS_TYPE_LABELS[key];
    const upper = key.toUpperCase();
    if (BUSINESS_TYPE_LABELS[upper]) return BUSINESS_TYPE_LABELS[upper];
    const tab = mapBusinessTypeTabCode(rawType);
    return BUSINESS_TYPE_NAMES[tab] || BUSINESS_TYPE_LABELS[tab] || key;
  }
  if (mockCode) return BUSINESS_TYPE_NAMES[mockCode] || 'Boshqa';
  return 'Boshqa';
}

function createMonogram(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'KM';
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
  const businessType = resolveBusinessTypeLabel(
    realCompany?.businessType || apiDetail?.businessType || apiDetail?.businessTypeName,
    mock?.[4]
  ) || (numId === 103 ? 'Oziq-ovqat' : 'Boshqa');

  const fiscalReceiptCount = Number(apiDetail?.fiscalReceiptsCount ?? apiDetail?.fiscalReceiptCount ?? 0);
  const nonFiscalReceiptCount = Number(apiDetail?.nonFiscalReceiptsCount ?? apiDetail?.nonFiscalReceiptCount ?? 0);
  const totalChecks30d = apiDetail?.totalReceiptsCount != null
    ? Number(apiDetail.totalReceiptsCount)
    : (apiDetail?.totalChecks30d != null
      ? Number(apiDetail.totalChecks30d)
      : (fiscalReceiptCount + nonFiscalReceiptCount > 0 ? fiscalReceiptCount + nonFiscalReceiptCount : null));

  const avgCheck = apiDetail?.avgReceiptAmount != null
    ? Number(apiDetail.avgReceiptAmount)
    : (apiDetail?.avgCheck != null
      ? Number(apiDetail.avgCheck)
      : (apiDetail?.averageCheck != null
        ? Number(apiDetail.averageCheck)
        : (totalChecks30d && apiDetail?.totalTurnover != null ? Number(apiDetail.totalTurnover) / totalChecks30d : null)));

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
    phone: realCompany?.phone || apiDetail?.phone || (numId === 103 ? '+998 88 934 44 44' : '—'),
    address: realCompany?.address || apiDetail?.address || (numId === 103 ? 'Samarqand sh., Makon Mall' : `${districtName}, O‘zbekiston`),
    fiscalModule: '—',
    totalChecks30d: totalChecks30d || null,
    avgCheck,
  };
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

  if (numId === 29 || companyName?.includes('Aminjon')) {
    const aminjon = SAMARQAND_PRODUCTS['Aminjon Samarqand XK'];
    if (aminjon) return aminjon;
  }

  const all = [...(SAMARQAND_PRODUCTS.A?.top || []), ...(SAMARQAND_PRODUCTS.O?.top || [])];
  const matched = all.filter((p) => p[1] === companyName).map((p) => [p[0], p[2], p[3]]);
  if (matched.length > 0) return matched;

  return [];
}

export function resolveCompanyReceipts({ numId, companyName, products = [], backendReceipts = null }) {
  if (Array.isArray(backendReceipts)) {
    return backendReceipts.map((r) => {
      const qty = Number(r.itemsQuantity ?? r.items_quantity ?? 0);
      return [
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
        qty > 0 ? [['', qty, 0]] : [],
        r.saleId,
      ];
    });
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
