import { SAMARQAND_COMPANIES, SAMARQAND_TURNOVER } from '../data/samarqandMockData';
import { fmtMoney, fmtPercent } from './analyticsFormat';

export const SAMARQAND_FULL_DISTRICTS = [
  { code: '01', name: 'Samarqand shahri', shortName: 'Samarqand sh.' },
  { code: '02', name: 'Oqdaryo tumani', shortName: 'Oqdaryo t.' },
  { code: '03', name: 'Bulung‘ur tumani', shortName: 'Bulung‘ur t.' },
  { code: '04', name: 'Jomboy tumani', shortName: 'Jomboy t.' },
  { code: '05', name: 'Ishtixon tumani', shortName: 'Ishtixon t.' },
  { code: '06', name: 'Kattaqo‘rg‘on tumani', shortName: 'Kattaqo‘rg‘on t.' },
  { code: '07', name: 'Qo‘shrabot tumani', shortName: 'Qo‘shrabot t.' },
  { code: '08', name: 'Narpay tumani', shortName: 'Narpay t.' },
  { code: '09', name: 'Nurobod tumani', shortName: 'Nurobod t.' },
  { code: '10', name: 'Payariq tumani', shortName: 'Payariq t.' },
  { code: '11', name: 'Pastdarg‘om tumani', shortName: 'Pastdarg‘om t.' },
  { code: '12', name: 'Paxtachi tumani', shortName: 'Paxtachi t.' },
  { code: '13', name: 'Samarqand tumani', shortName: 'Samarqand t.' },
  { code: '14', name: 'Toyloq tumani', shortName: 'Toyloq t.' },
  { code: '15', name: 'Urgut tumani', shortName: 'Urgut t.' },
  { code: '16', name: 'Kattaqo‘rg‘on shahri', shortName: 'Kattaqo‘rg‘on sh.' },
];

const PERIOD_LABELS = {
  today: { label: 'Bugun', cmp: 'kechaga nisbatan' },
  '7d': { label: '7 kun', cmp: 'oldingi 7 kunga nisbatan' },
  '30d': { label: '30 kun', cmp: 'oldingi 30 kunga nisbatan' },
  month: { label: 'Shu oy', cmp: 'oldingi davrga nisbatan' },
  year: { label: 'Yil', cmp: 'o‘tgan yilga nisbatan' },
};

export function buildSamarqandDistricts(companies = SAMARQAND_COMPANIES, backendResultsRows = null) {
  const rowsMap = new Map();
  if (Array.isArray(backendResultsRows)) {
    backendResultsRows.forEach((r) => {
      const raw = String(r.code || '');
      if (raw.toUpperCase() === 'UNASSIGNED') return;
      rowsMap.set(raw, r);
      if (raw.length >= 2) {
        rowsMap.set(raw.slice(-2), r);
      }
    });
  }

  const hasBackend = Array.isArray(backendResultsRows);

  return SAMARQAND_FULL_DISTRICTS.map((d) => {
    const backendRow = rowsMap.get(d.code) || rowsMap.get(`18${d.code}`);
    if (backendRow) {
      const enterprises = Number(backendRow.enterprises ?? 0);
      const connected = Number(backendRow.connected ?? 0);
      const turnover = Number(backendRow.totalTurnover ?? 0);
      const fiscalTurnover = Number(backendRow.fiscalTurnover ?? 0);
      const fiscalPct = backendRow.fiscalSharePct != null ? Number(backendRow.fiscalSharePct) : null;
      const delta = backendRow.turnoverDeltaPct != null ? Number(backendRow.turnoverDeltaPct) : null;
      return {
        code: d.code,
        name: backendRow.nameUz || backendRow.nameRu || d.name,
        shortName: d.shortName,
        companies: enterprises,
        connected,
        turnover,
        fiscalTurnover,
        fiscalSharePct: fiscalPct,
        turnoverDeltaPct: delta,
        hasCompanies: enterprises > 0,
        link: `/platform/analytics/viloyatlar/18?district=${d.code}`,
      };
    }

    if (hasBackend) {
      return {
        code: d.code,
        name: d.name,
        shortName: d.shortName,
        companies: 0,
        connected: 0,
        turnover: 0,
        fiscalTurnover: 0,
        fiscalSharePct: null,
        turnoverDeltaPct: null,
        hasCompanies: false,
        link: `/platform/analytics/viloyatlar/18?district=${d.code}`,
      };
    }

    const comps = Array.isArray(companies) ? companies.filter((c) => c[3] === d.code) : [];
    const count = comps.length;
    const connected = comps.filter((c) => c[5] === 1).length;
    const turnover = comps.reduce((sum, c) => sum + (c[7] || 0), 0);

    return {
      code: d.code,
      name: d.name,
      shortName: d.shortName,
      companies: count,
      connected,
      turnover,
      fiscalTurnover: turnover > 0 ? (turnover * 0.95) : 0,
      fiscalSharePct: turnover > 0 ? 95 : null,
      turnoverDeltaPct: null,
      hasCompanies: count > 0,
      link: `/platform/analytics/viloyatlar/18?district=${d.code}`,
    };
  });
}

export function filterAndSortDistricts(districts, filter = 'all', sort = 'turnover') {
  const filtered = districts.filter((d) => {
    if (filter === 'active') return d.hasCompanies;
    if (filter === 'empty') return !d.hasCompanies;
    return true;
  });

  const byName = (a, b) => a.name.localeCompare(b.name, 'uz');
  const ratio = (d) => (d.companies > 0 ? d.connected / d.companies : -1);

  return [...filtered].sort((a, b) => {
    if (sort === 'companies') return (b.companies - a.companies) || (b.turnover - a.turnover) || byName(a, b);
    if (sort === 'connected') return (ratio(b) - ratio(a)) || (b.companies - a.companies) || byName(a, b);
    if (sort === 'name') return byName(a, b);
    return (b.turnover - a.turnover) || (b.companies - a.companies) || byName(a, b);
  });
}

export function buildSamarqandKpis(districts = [], period = '30d', backendKpi = null) {
  if (backendKpi && (backendKpi.totalEnterprises > 0 || backendKpi.totalTurnover > 0)) {
    const totalComps = Number(backendKpi.totalEnterprises || 0);
    const totalConn = Number(backendKpi.connected || 0);
    const notConn = Math.max(0, totalComps - totalConn);
    const connPct = backendKpi.connectedSharePct != null
      ? fmtPercent(Number(backendKpi.connectedSharePct))
      : (totalComps > 0 ? fmtPercent((totalConn / totalComps) * 100) : '0%');

    return [
      {
        label: 'Umumiy aylanma',
        value: fmtMoney(Number(backendKpi.totalTurnover || 0)),
        delta: backendKpi.totalTurnoverDeltaPct != null ? Number(backendKpi.totalTurnoverDeltaPct) : null,
        hint: PERIOD_LABELS[period]?.cmp || 'oldingi davrga nisbatan',
      },
      {
        label: 'Jami korxonalar',
        value: String(totalComps),
        hint: '16 ta tuman va shahar bo‘yicha',
      },
      {
        label: 'Ulangan korxonalar',
        value: String(totalConn),
        badgeText: connPct,
        hint: `${notConn} ta korxona hali ulanmagan`,
      },
      {
        label: 'Yangi ulanishlar',
        value: String(backendKpi.newConnections ?? 0),
        delta: backendKpi.newConnectionsDeltaPct != null ? Number(backendKpi.newConnectionsDeltaPct) : null,
        hint: 'Tanlangan davrda',
      },
    ];
  }

  const totalComps = districts.reduce((acc, d) => acc + (d.companies || 0), 0);
  const totalConn = districts.reduce((acc, d) => acc + (d.connected || 0), 0);
  const totalTurnover = districts.reduce((acc, d) => acc + (d.turnover || 0), 0);
  const notConnected = Math.max(0, totalComps - totalConn);
  const connPct = totalComps > 0 ? fmtPercent((totalConn / totalComps) * 100) : '0%';
  const fallbackTurnover = totalTurnover > 0 ? totalTurnover : (SAMARQAND_TURNOVER?.A?.m30 || 0);

  return [
    {
      label: 'Umumiy aylanma',
      value: fmtMoney(fallbackTurnover),
      delta: null,
      hint: PERIOD_LABELS[period]?.cmp || 'oldingi davrga nisbatan',
    },
    {
      label: 'Jami korxonalar',
      value: String(totalComps),
      hint: '16 ta tuman va shahar bo‘yicha',
    },
    {
      label: 'Ulangan korxonalar',
      value: String(totalConn),
      badgeText: connPct,
      hint: `${notConnected} ta korxona hali ulanmagan`,
    },
    {
      label: 'Yangi ulanishlar',
      value: '0',
      delta: null,
      hint: 'Tanlangan davrda',
    },
  ];
}
