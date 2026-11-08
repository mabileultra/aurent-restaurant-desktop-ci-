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
  const districtCode = String(raw.districtCode || '').padStart(2, '0');
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
  const fiscal = inType.reduce((sum, c) => sum + Number(c[9] || (c[7] ? c[7] * 0.95 : 0)), 0);
  const nonFiscal = Math.max(0, total - fiscal);
  const fShare = total > 0 ? (fiscal / total) * 100 : 0;
  const d7 = total > 0 ? Math.round(total * 0.25) : 0;

  return {
    all: total,
    allF: fiscal,
    allN: nonFiscal,
    f30: fShare,
    m30: total,
    d7,
    day: 0,
    fShareText: formatPercent(fShare),
    nfShareText: formatPercent(100 - fShare),
  };
}

export function computeBusinessTypeTabs({ companies = [], isDistrictView = false, baseTypes = [] }) {
  if (!isDistrictView && baseTypes.length > 0) {
    return baseTypes;
  }

  const allN = companies.length;
  const allC = companies.filter((c) => c[5] === 1).length;
  const byType = (tId) => {
    const matching = companies.filter((c) => c[4] === tId);
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
  Object.entries(districtNames).forEach(([code, name]) => {
    list.push({ value: code, label: name });
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
