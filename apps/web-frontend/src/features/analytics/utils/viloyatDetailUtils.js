export const RING_CIRCUMFERENCE = 2 * Math.PI * 38;
const GAP = 3;

export function formatCompact(num) {
  const val = Number(num || 0);
  if (!val) return '0';
  if (val >= 1e9) {
    return `${(val / 1e9).toFixed(2).replace('.', ',')} mlrd`;
  }
  if (val >= 1e6) {
    return `${(val / 1e6).toFixed(1).replace('.', ',')} mln`;
  }
  if (val >= 1e3) {
    return `${Math.round(val / 1e3).toLocaleString('ru-RU')} ming`;
  }
  return Number(val).toLocaleString('ru-RU');
}

export function formatPercent(val) {
  if (val == null) return '—';
  const rounded = Math.round(Number(val) * 10) / 10;
  return `${String(rounded).replace('.', ',')}%`;
}

export function calculateRingDash(percent, radius = 38) {
  const circ = 2 * Math.PI * radius;
  const full = circ.toFixed(1);
  if (percent == null) {
    return { gDash: `0 ${full}`, rDash: `0 ${full}`, rOff: '0' };
  }
  const p = Math.min(100, Math.max(0, Number(percent)));
  if (p >= 100) {
    return { gDash: `${full} ${full}`, rDash: `0 ${full}`, rOff: '0' };
  }
  if (p <= 0) {
    return { gDash: `0 ${full}`, rDash: `${full} ${full}`, rOff: '0' };
  }
  const greenLen = (circ * p) / 100;
  const redLen = Math.max(1.5, circ - greenLen - 2 * GAP);
  return {
    gDash: `${greenLen.toFixed(1)} ${full}`,
    rDash: `${redLen.toFixed(1)} ${full}`,
    rOff: (-(greenLen + GAP)).toFixed(1),
  };
}

export function calculateDeltaBadge(delta) {
  if (delta == null) return null;
  const num = Number(delta);
  if (num >= 0) {
    return { text: `▲ ${formatPercent(num)}`, isUp: true };
  }
  return { text: `▼ ${formatPercent(Math.abs(num))}`, isUp: false };
}

export function calculateDistrictsBreakdown(companies, districtNames = {}) {
  const map = new Map();
  companies.forEach((comp) => {
    const dCode = comp[3] || 'other';
    const entry = map.get(dCode) || { code: dCode, name: districtNames[dCode] || dCode, count: 0, turnover: 0 };
    entry.count += 1;
    entry.turnover += Number(comp[7] || 0);
    map.set(dCode, entry);
  });

  const all = Array.from(map.values()).sort((a, b) => (b.turnover - a.turnover) || (b.count - a.count));
  const withSales = all.filter((x) => x.turnover > 0);
  const maxTurnover = withSales.length ? withSales[0].turnover : 1;
  const quietCount = all.length - withSales.length;

  return {
    districts: withSales.slice(0, 5),
    quietCount,
    maxTurnover,
    totalWithDistricts: all.length,
  };
}

const FULL_DISTRICT_NAMES = {
  '01': 'Samarqand shahri',
  '02': 'Oqdaryo tumani',
  '03': 'Bulung‘ur tumani',
  '04': 'Jomboy tumani',
  '05': 'Ishtixon tumani',
  '06': 'Kattaqo‘rg‘on tumani',
  '07': 'Qo‘shrabot tumani',
  '08': 'Narpay tumani',
  '09': 'Nurobod tumani',
  '10': 'Payariq tumani',
  '11': 'Pastdarg‘om tumani',
  '12': 'Paxtachi tumani',
  '13': 'Samarqand tumani',
  '14': 'Toyloq tumani',
  '15': 'Urgut tumani',
  '16': 'Kattaqo‘rg‘on shahri',
};

export function mapDistrictNames(geoDistricts = [], fallback = {}) {
  const map = { ...fallback, ...FULL_DISTRICT_NAMES };
  geoDistricts.forEach((d) => {
    const raw = String(d.code || '');
    const name = d.nameUz || d.nameRu || FULL_DISTRICT_NAMES[raw] || raw;
    map[raw] = name;
    if (raw.length >= 2) {
      map[raw.slice(-2)] = name;
    }
  });
  return map;
}

export function formatCompanyRows(paginationResult, districtNames = {}, typeNames = {}) {
  const { rows = [], from = 0 } = paginationResult;
  return rows.map((comp, idx) => {
    const deltaObj = calculateDeltaBadge(comp[8]);
    return {
      rowNumber: from + idx,
      id: comp[0],
      name: comp[1],
      tin: comp[2] && comp[2] !== '_' ? comp[2] : '—',
      district: districtNames[comp[3]] || comp[3] || '—',
      type: typeNames[comp[4]] || comp[4],
      isConnected: comp[5] === 1,
      turnover30d: comp[7],
      deltaText: deltaObj ? deltaObj.text : '—',
      isDeltaUp: deltaObj ? deltaObj.isUp : null,
    };
  });
}

export function filterAndPaginateCompanies(companies, {
  type = 'A',
  district = 'all',
  status = 'all',
  query = '',
  page = 0,
  pageSize = 10,
}) {
  const cleanQ = String(query || '').trim().toLowerCase();
  const targetDist = district && district !== 'all' ? String(district).slice(-2) : null;
  const filtered = companies.filter((comp) => {
    const matchesType = type === 'A' || comp[4] === type;
    if (!matchesType) return false;

    const matchesDistrict = !targetDist || String(comp[3] || '').slice(-2) === targetDist;
    if (!matchesDistrict) return false;

    const isConnected = comp[5] === 1;
    const matchesStatus = status === 'all' || (status === 'on' ? isConnected : !isConnected);
    if (!matchesStatus) return false;

    if (!cleanQ) return true;
    const nameMatch = String(comp[1] || '').toLowerCase().includes(cleanQ);
    const tinMatch = String(comp[2] || '').includes(cleanQ);
    return nameMatch || tinMatch;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const from = total ? safePage * pageSize + 1 : 0;
  const to = Math.min(total, safePage * pageSize + pageSize);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return {
    rows,
    total,
    totalPages,
    page: safePage,
    from,
    to,
  };
}
