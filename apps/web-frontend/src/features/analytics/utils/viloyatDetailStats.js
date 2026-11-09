import { formatPercent } from './viloyatDetailUtils';

/**
 * Normalizes backend company JSON or mock array to a uniform tuple:
 * [id, name, tin, districtCode, type, isConnected (0/1), storeCount, turnover, delta, fiscalTurnover]
 */
export function normalizeBackendCompany(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.companyId ?? raw.id;
  const name = raw.name || raw.storeNames || '—';
  const tin = raw.tin || '_';
  const rawDist = String(raw.districtCode || '');
  const districtCode = rawDist.length > 2 ? rawDist.slice(-2) : rawDist.padStart(2, '0');
  const type = raw.businessType || raw.activitySubtype || 'O';
  const isConnected = raw.connected ? 1 : 0;
  const storeCount = raw.storeCount || 1;
  const turnover = Number(raw.totalTurnover || 0);
  const delta = raw.weekDeltaPct != null ? Number(raw.weekDeltaPct) : null;
  const fiscal = Number(raw.fiscalTurnover || 0);

  return [id, name, tin, districtCode, type, isConnected, storeCount, turnover, delta, fiscal];
}

export function normalizeCompaniesList(list, fallbackList = []) {
  if (Array.isArray(list) && list.length > 0) {
    return list.map(normalizeBackendCompany).filter(Boolean);
  }
  return fallbackList;
}

export function computeDistrictTurnover({ companies = [], activeType = 'A', isDistrictView = false, baseTurnover }) {
  if (!isDistrictView && baseTurnover) {
    return baseTurnover;
  }

  const inType = companies.filter((c) => activeType === 'A' || c[4] === activeType);
  const total = inType.reduce((sum, c) => sum + Number(c[7] || 0), 0);
  const fiscal = inType.reduce((sum, c) => sum + Number(c[9] || 0), 0);
  const nonFiscal = Math.max(0, total - fiscal);
  const fShare = total > 0 ? (fiscal / total) * 100 : null;
  const d7 = null;

  return {
    all: total,
    allF: fiscal,
    allN: nonFiscal,
    f30: fShare,
    m30: total,
    d7,
    day: 0,
    fShareText: formatPercent(fShare),
    nfShareText: fShare != null ? formatPercent(100 - fShare) : '—',
  };
}

export function computeBusinessTypeTabs({ companies = [], isDistrictView = false, baseTypes = [] }) {
  const allN = companies.length;
  const allC = companies.filter((c) => c[5] === 1).length;
  const byType = (tId) => {
    const matching = companies.filter((c) => c[4] === tId || (tId === 'F' && c[4] === 'G'));
    return { n: matching.length, c: matching.filter((c) => c[5] === 1).length };
  };

  return [
    { id: 'A', label: 'Hammasi', n: allN, c: allC },
    { id: 'F', label: 'Oziq-ovqat', ...byType('F') },
    { id: 'R', label: 'Restoranlar', ...byType('R') },
    { id: 'P', label: 'Dorixonalar', ...byType('P') },
    { id: 'O', label: 'Boshqalar', ...byType('O') },
  ];
}

export function generateDailyBars(baseDays = [], turnoverRatio = 1) {
  const ratio = Math.max(0.01, Math.min(turnoverRatio, 1));
  const scaledDays = baseDays.map((val) => (val > 0 ? Math.round(val * ratio) : 0));
  const maxDay = Math.max(...scaledDays, 1);
  const monthNames = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

  return scaledDays.map((val, idx) => {
    const d = new Date(2026, 9, 10 + idx);
    const dayLabel = `${d.getDate()}-${monthNames[d.getMonth()]}`;
    const tip = val ? `${dayLabel}: ${val.toLocaleString('ru-RU')} mln so‘m` : `${dayLabel}: savdo yo‘q`;
    const heightPercent = val ? Math.max(6, (val / maxDay) * 100) : 4;
    return { tip, heightPercent, val };
  });
}

export function resolveDistrictMeta({ isDistrictView, totalCount, connectedCount, totalDistricts = 16 }) {
  if (isDistrictView) {
    return `${totalCount} korxona · ${connectedCount} ulangan`;
  }
  return `${totalCount} korxona · ${connectedCount} ulangan · ${totalDistricts} ta tuman va shahar`;
}

export function buildDistrictOptions(districtNames = {}) {
  const list = [{ value: 'all', label: 'Barcha tumanlar' }];
  const seen = new Set();
  Object.entries(districtNames).forEach(([code, name]) => {
    const shortCode = code.length > 2 ? code.slice(-2) : code;
    if (!seen.has(shortCode) && shortCode !== 'all') {
      seen.add(shortCode);
      list.push({ value: shortCode, label: name });
    }
  });
  return list;
}

export function mapProductList(rawProducts = []) {
  const topMax = rawProducts.length ? (rawProducts[0][3] || 1) : 1;
  return rawProducts.map((p, idx) => ({
    rank: idx + 1,
    name: p[0],
    company: p[1],
    qty: p[2],
    amount: p[3],
    barPercent: Math.max(3, (p[3] / topMax) * 100),
    isSuspiciousPrice: p[3] / p[2] < 100,
    unitPrice: Math.round(p[3] / p[2]),
  }));
}

export function calculateCompaniesBreakdown(companies = [], typeNames = {}) {
  const sorted = [...companies].sort((a, b) => (Number(b[7] || 0) - Number(a[7] || 0)) || (b[5] - a[5]));
  const withSales = sorted.filter((c) => Number(c[7] || 0) > 0);
  const targetList = withSales.length > 0 ? withSales : sorted;
  const maxTurnover = withSales.length ? Number(withSales[0][7] || 0) : 1;
  const quietCount = sorted.length - withSales.length;

  const list = targetList.slice(0, 5).map((comp) => ({
    code: String(comp[0]),
    name: comp[1],
    extra: typeNames[comp[4]] || comp[4],
    count: 1,
    turnover: Number(comp[7] || 0),
  }));

  return {
    districts: list,
    quietCount,
    maxTurnover,
    totalWithDistricts: sorted.length,
  };
}

export function resolveScopedProducts(allProducts = {}, activeType = 'A', isDistrictView = false, districtCompanies = []) {
  const group = allProducts[activeType] || { top: [], low: [] };
  if (!isDistrictView || !districtCompanies.length) return group;
  const allowedNames = new Set(districtCompanies.map((c) => c[1]));
  const filteredTop = group.top.filter((p) => allowedNames.has(p[1]));
  const filteredLow = group.low.filter((p) => allowedNames.has(p[1]));
  return {
    top: filteredTop.length > 0 ? filteredTop : group.top,
    low: filteredLow.length > 0 ? filteredLow : group.low,
  };
}
