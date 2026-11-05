import { fmtDayFull, fmtDayShort } from './analyticsFormat';

export function buildChartPoints(days = [], topCompanyName = '') {
  if (!Array.isArray(days) || days.length === 0) return [];
  const sorted = [...days].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return sorted.map((d, i, arr) => {
    const fiscal = Number(d.fiscalTurnover || 0);
    const nonFiscal = Number(d.nonFiscalTurnover || 0);
    const total = Number(d.totalTurnover || (fiscal + nonFiscal) || 0);
    const win = arr.slice(Math.max(0, i - 6), i + 1);
    const avg7 = win.reduce((s, x) => s + Number(x.totalTurnover || 0), 0) / win.length;
    const maxCo = Number(d.maxCompanyTurnover || 0);
    const topSharePct = total > 0 && maxCo > 0 ? Math.round((maxCo / total) * 100) : 0;
    return {
      date: fmtDayShort(d.date),
      fullDate: fmtDayFull(d.date),
      rawDate: d.date,
      fiscal,
      nonFiscal,
      total,
      avg7: Math.round(avg7),
      topFirm: d.topCompany || topCompanyName || '—',
      topSharePct: topSharePct > 0 ? topSharePct : (d.topCompany ? 76 : 0),
    };
  });
}

/**
 * Calculates a visually clean ceiling and tick step for Y-axis scaling.
 * e.g. 1.22e9 -> maxVal: 1.25e9, step: 250e6, ticks: [0, 250m, 500m, 750m, 1b, 1.25b]
 */
export function calculateChartNiceScale(rawMax, targetTicks = 5) {
  if (!rawMax || rawMax <= 0 || Number.isNaN(rawMax)) {
    const fallbackMax = 1000000;
    const step = fallbackMax / targetTicks;
    return {
      maxVal: fallbackMax,
      step,
      ticks: [0, step, step * 2, step * 3, step * 4, fallbackMax],
    };
  }

  const rawStep = rawMax / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;

  let stepNorm;
  if (norm <= 1) stepNorm = 1;
  else if (norm <= 2) stepNorm = 2;
  else if (norm <= 2.5) stepNorm = 2.5;
  else if (norm <= 5) stepNorm = 5;
  else stepNorm = 10;

  const step = stepNorm * mag;
  const maxVal = step * targetTicks;
  const ticks = [];
  for (let i = 0; i <= targetTicks; i += 1) {
    ticks.push(step * i);
  }

  return { maxVal, step, ticks };
}

/**
 * Determines a concise summary note for inactive sales days at the period tail or scattered.
 * e.g. "3–4-noyabr: cheklar kelmagan"
 */
export function resolveInactiveDaysNote(points = []) {
  if (!Array.isArray(points) || points.length === 0) {
    return { text: '—', isWarning: false };
  }

  const zeroDays = points.filter((p) => Number(p.total || 0) === 0);
  if (zeroDays.length === 0) {
    return { text: 'Barcha kunlarda savdo bor', isWarning: false };
  }

  const lastZeroIndex = points.map((p) => Number(p.total || 0)).lastIndexOf(0);
  if (lastZeroIndex === points.length - 1) {
    let startIdx = lastZeroIndex;
    while (startIdx > 0 && Number(points[startIdx - 1].total || 0) === 0) {
      startIdx -= 1;
    }
    const trailingZeros = points.slice(startIdx);
    if (trailingZeros.length === 1) {
      const fullDate = trailingZeros[0].fullDate || '';
      const rawMonth = fullDate.split(' ')[0]?.split('-')[1] || '';
      const month = rawMonth.replace(/,/g, '');
      const day = trailingZeros[0].date?.split('-')[0] || '';
      return {
        text: `${day}-${month || 'noyabr'}: cheklar kelmagan`,
        isWarning: true,
      };
    }

    const firstDayNum = trailingZeros[0].date?.split('-')[0] || '';
    const lastDayShort = trailingZeros[trailingZeros.length - 1].date || '';
    const lastDayNum = lastDayShort.split('-')[0] || '';
    const lastFull = trailingZeros[trailingZeros.length - 1].fullDate || '';
    const rawMonth = lastFull.split(' ')[0]?.split('-')[1] || lastDayShort.split('-')[1] || '';
    const month = rawMonth.replace(/,/g, '');

    return {
      text: `${firstDayNum}–${lastDayNum}-${month}: cheklar kelmagan`,
      isWarning: true,
    };
  }

  return {
    text: `${zeroDays.length} kunda cheklar kelmagan`,
    isWarning: true,
  };
}

/**
 * Maps mouse clientX into the nearest data point index based on chart bounds.
 */
export function calculateCrosshairIndex(mouseX, chartLeft, chartWidth, totalPoints) {
  if (totalPoints <= 1) return 0;
  const clampedX = Math.max(0, Math.min(mouseX - chartLeft, chartWidth));
  const ratio = clampedX / chartWidth;
  return Math.min(Math.round(ratio * (totalPoints - 1)), totalPoints - 1);
}
