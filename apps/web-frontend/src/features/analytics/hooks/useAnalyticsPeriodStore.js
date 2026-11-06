import { create } from 'zustand';

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDateUz(d) {
  const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  return `${d.getDate()}-${months[d.getMonth()]}`;
}

function formatDateUzFull(d) {
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
}

export function computePeriodLabels(period, customFrom, customTo, backendFrom, backendTo) {
  const now = new Date();

  if (period === 'today') {
    return {
      currentLabel: `${formatDateUz(now)}, ${now.getFullYear()}`,
      compareLabel: 'Taqqoslash: Kecha',
    };
  }

  if (period === '7d') {
    const end = backendTo ? new Date(backendTo) : now;
    const start = backendFrom ? new Date(backendFrom) : new Date(now.getTime() - 6 * 86400000);
    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - 6 * 86400000);
    return {
      currentLabel: `${formatDateUz(start)} – ${formatDateUz(end)}, ${end.getFullYear()}`,
      compareLabel: `Taqqoslash: ${formatDateUz(prevStart)} – ${formatDateUz(prevEnd)}`,
    };
  }

  if (period === 'month') {
    const m = now.getMonth();
    const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
    const prevM = m === 0 ? 11 : m - 1;
    return {
      currentLabel: `${months[m]} ${now.getFullYear()}`,
      compareLabel: `Taqqoslash: ${months[prevM]}`,
    };
  }

  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + 1;
    const roman = ['I', 'II', 'III', 'IV'];
    const prevQ = q === 1 ? 4 : q - 1;
    return {
      currentLabel: `${roman[q - 1]} chorak, ${now.getFullYear()}`,
      compareLabel: `Taqqoslash: ${roman[prevQ - 1]} chorak`,
    };
  }

  if (period === 'year') {
    return {
      currentLabel: `${now.getFullYear()}-yil`,
      compareLabel: `Taqqoslash: ${now.getFullYear() - 1}-yil`,
    };
  }

  if (customFrom && customTo) {
    const d1 = new Date(customFrom);
    const d2 = new Date(customTo);
    return {
      currentLabel: `${formatDateUz(d1)} – ${formatDateUz(d2)}, ${d2.getFullYear()}`,
      compareLabel: 'Taqqoslash: Oldingi davr',
    };
  }

  // Default '30d'
  const end = backendTo ? new Date(backendTo) : new Date();
  const start = backendFrom ? new Date(backendFrom) : new Date(end.getTime() - 29 * 86400000);
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - 29 * 86400000);
  return {
    currentLabel: `${formatDateUz(start)} – ${formatDateUz(end)}, ${end.getFullYear()}`,
    compareLabel: `Taqqoslash: ${formatDateUz(prevStart)} – ${formatDateUz(prevEnd)}`,
  };
}

export const useAnalyticsPeriodStore = create((set, get) => ({
  period: '30d',
  customFrom: '',
  customTo: '',
  backendFrom: '',
  backendTo: '',
  setPeriod: (period) => {
    set({ period, customFrom: '', customTo: '' });
  },
  setCustomRange: ({ from, to }) => {
    set({ period: from && to ? 'custom' : '30d', customFrom: from || '', customTo: to || '' });
  },
  setBackendDates: (from, to) => {
    if (from !== get().backendFrom || to !== get().backendTo) {
      set({ backendFrom: from || '', backendTo: to || '' });
    }
  },
  getLabels: () => {
    const s = get();
    return computePeriodLabels(s.period, s.customFrom, s.customTo, s.backendFrom, s.backendTo);
  },
}));
