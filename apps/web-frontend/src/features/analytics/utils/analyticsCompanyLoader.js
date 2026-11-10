import { analyticsApi } from '../api/analyticsApi';
import { fmtDayShort } from './analyticsFormat';

/**
 * Loads all companies across backend pages (backend limit is 100 per page).
 * Guarantees all companies (e.g. 114) are fetched for accurate global sorting and KPIs.
 */
export async function fetchAllCompanies(filterParams = {}) {
  const page0Res = await analyticsApi.getCompanies({ ...filterParams, page: 0, size: 100 });
  const page0 = page0Res?.data ?? {};
  const total = Number(page0.totalElements ?? page0.rows?.length ?? 0);
  const allRows = [...(page0.rows ?? [])];

  if (total > 100) {
    const totalPages = Math.ceil(total / 100);
    const promises = [];
    for (let p = 1; p < totalPages; p += 1) {
      promises.push(
        analyticsApi
          .getCompanies({ ...filterParams, page: p, size: 100 })
          .then((res) => res?.data?.rows ?? [])
      );
    }
    const otherPages = await Promise.all(promises);
    otherPages.forEach((rows) => {
      allRows.push(...rows);
    });
  }

  return {
    rows: allRows,
    totalElements: total || allRows.length,
  };
}

/**
 * Aggregates daily turnover across top active companies to produce
 * real republic-level daily turnover dynamics.
 */
export function aggregateRepublicDays(companyDetails = []) {
  if (!Array.isArray(companyDetails) || companyDetails.length === 0) {
    return [];
  }

  const map = new Map();

  companyDetails.forEach((cd) => {
    if (!cd || !Array.isArray(cd.days)) return;
    const companyName = cd.name || 'Korxona';

    cd.days.forEach((d) => {
      if (!d?.date) return;
      const key = d.date;
      const fisc = Number(d.fiscalTurnover || 0);
      const nonFisc = Number(d.nonFiscalTurnover || 0);
      const tot = Number(d.totalTurnover || (fisc + nonFisc) || 0);

      const existing = map.get(key) || {
        date: key,
        fiscalTurnover: 0,
        nonFiscalTurnover: 0,
        totalTurnover: 0,
        topCompany: companyName,
        maxCompanyTurnover: 0,
      };

      existing.fiscalTurnover += fisc;
      existing.nonFiscalTurnover += nonFisc;
      existing.totalTurnover += tot;

      if (tot > existing.maxCompanyTurnover) {
        existing.maxCompanyTurnover = tot;
        existing.topCompany = companyName;
      }

      map.set(key, existing);
    });
  });

  return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

/**
 * Aggregates weekly turnover across companies for the fiscal share breakdown card.
 */
export function aggregateRepublicWeeks(companyDetails = []) {
  if (!Array.isArray(companyDetails) || companyDetails.length === 0) {
    return [];
  }

  const map = new Map();

  companyDetails.forEach((cd) => {
    if (!cd || !Array.isArray(cd.weeks)) return;

    cd.weeks.forEach((w) => {
      const key = w.weekFrom || w.label || 'week';
      const fisc = Number(w.fiscalTurnover || 0);
      const nonFisc = Number(w.nonFiscalTurnover || 0);
      const tot = Number(w.totalTurnover || (fisc + nonFisc) || 0);

      const existing = map.get(key) || {
        weekFrom: w.weekFrom,
        weekTo: w.weekTo,
        label: w.weekFrom && w.weekTo ? `${fmtDayShort(w.weekFrom)}–${fmtDayShort(w.weekTo)}` : (w.label || key),
        fiscalTurnover: 0,
        nonFiscalTurnover: 0,
        totalTurnover: 0,
      };

      existing.fiscalTurnover += fisc;
      existing.nonFiscalTurnover += nonFisc;
      existing.totalTurnover += tot;

      map.set(key, existing);
    });
  });

  return Array.from(map.values())
    .sort((a, b) => String(a.weekFrom || '').localeCompare(String(b.weekFrom || '')))
    .map((w) => ({
      ...w,
      fiscalSharePct: w.totalTurnover > 0 ? (w.fiscalTurnover / w.totalTurnover) * 100 : 0,
    }));
}

/**
 * Roll republic daily points into week buckets (Mon–Sun, Asia/Tashkent dates as ISO strings).
 */
export function weeksFromRepublicDays(days = []) {
  if (!Array.isArray(days) || days.length === 0) return [];

  const map = new Map();
  days.forEach((d) => {
    if (!d?.date) return;
    const date = new Date(`${d.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return;
    const day = date.getDay(); // 0 Sun .. 6 Sat
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekFrom = monday.toISOString().slice(0, 10);
    const weekTo = sunday.toISOString().slice(0, 10);
    const key = weekFrom;

    const fisc = Number(d.fiscalTurnover || 0);
    const nonFisc = Number(d.nonFiscalTurnover || 0);
    const tot = Number(d.totalTurnover || (fisc + nonFisc) || 0);
    const existing = map.get(key) || {
      weekFrom,
      weekTo,
      label: `${fmtDayShort(weekFrom)}–${fmtDayShort(weekTo)}`,
      fiscalTurnover: 0,
      nonFiscalTurnover: 0,
      totalTurnover: 0,
    };
    existing.fiscalTurnover += fisc;
    existing.nonFiscalTurnover += nonFisc;
    existing.totalTurnover += tot;
    map.set(key, existing);
  });

  return Array.from(map.values())
    .sort((a, b) => String(a.weekFrom).localeCompare(String(b.weekFrom)))
    .map((w) => ({
      ...w,
      fiscalSharePct: w.totalTurnover > 0 ? (w.fiscalTurnover / w.totalTurnover) * 100 : 0,
    }));
}
