import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  addYears,
  subYears,
} from 'date-fns';
import { ru, uz } from 'date-fns/locale';

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function toIsoDate(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (!isValid(d) || Number.isNaN(d.getTime())) return '';
    return format(d, 'yyyy-MM-dd');
  }
  if (value instanceof Date && isValid(value) && !Number.isNaN(value.getTime())) {
    return format(value, 'yyyy-MM-dd');
  }
  return '';
}

export function formatDisplayDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const parts = isoDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDate;
}

export function formatMonthTitle(date, isRu = false) {
  if (!date || !isValid(date)) return '';
  const locale = isRu ? ru : uz;
  const str = format(date, 'LLLL yyyy', { locale });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getMonthGridDays(cursorDate) {
  if (!cursorDate || !isValid(cursorDate)) return [];
  const monthStart = startOfMonth(cursorDate);
  const monthEnd = endOfMonth(cursorDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((date) => {
    const iso = format(date, 'yyyy-MM-dd');
    return {
      date,
      iso,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === cursorDate.getMonth(),
    };
  });
}

export function calculateDaysInclusive(fromIso, toIso) {
  if (!fromIso || !toIso) return 0;
  try {
    const dFrom = parseISO(fromIso);
    const dTo = parseISO(toIso);
    if (!isValid(dFrom) || !isValid(dTo)) return 0;
    const diff = differenceInCalendarDays(dTo, dFrom);
    return Math.max(0, diff) + 1;
  } catch {
    return 0;
  }
}

export function getPresets(baseDate = new Date()) {
  const todayIso = toIsoDate(baseDate);
  const yesterdayIso = toIsoDate(subDays(baseDate, 1));
  const last7Iso = toIsoDate(subDays(baseDate, 6));
  const last30Iso = toIsoDate(subDays(baseDate, 29));
  const thisMonthStartIso = toIsoDate(startOfMonth(baseDate));
  const thisMonthEndIso = toIsoDate(endOfMonth(baseDate));
  const prevMonthDate = subMonths(baseDate, 1);
  const prevMonthStartIso = toIsoDate(startOfMonth(prevMonthDate));
  const prevMonthEndIso = toIsoDate(endOfMonth(prevMonthDate));

  return [
    { id: 'today', range: { from: todayIso, to: todayIso } },
    { id: 'yesterday', range: { from: yesterdayIso, to: yesterdayIso } },
    { id: 'last7Days', range: { from: last7Iso, to: todayIso } },
    { id: 'last30Days', range: { from: last30Iso, to: todayIso } },
    { id: 'thisMonth', range: { from: thisMonthStartIso, to: thisMonthEndIso } },
    { id: 'lastMonth', range: { from: prevMonthStartIso, to: prevMonthEndIso } },
    { id: 'allTime', range: { from: '', to: '' } },
  ];
}

export const I18N_FALLBACKS = {
  uz: {
    placeholderRange: 'Sana oralig‘i',
    placeholderSingle: 'Sanani tanlang',
    today: 'Bugun',
    yesterday: 'Kecha',
    last7Days: 'Oxirgi 7 kun',
    last30Days: 'Oxirgi 30 kun',
    thisMonth: 'Shu oy',
    lastMonth: 'O‘tgan oy',
    allTime: 'Barcha davr',
    cancel: 'Bekor qilish',
    apply: 'Qo‘llash',
    clear: 'Tozalash',
    close: 'Yopish',
    notSelected: 'Sana tanlanmagan',
    selectEndDate: 'Tugash sanasini tanlang',
    daysCount: (count) => `${count} kun`,
    quickDays: (count) => `+${count} kun`,
    weekdays: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
    prevMonth: 'Oldingi oy',
    nextMonth: 'Keyingi oy',
    prevYear: 'Oldingi yil',
    nextYear: 'Keyingi yil',
  },
  ru: {
    placeholderRange: 'Диапазон дат',
    placeholderSingle: 'Выберите дату',
    today: 'Сегодня',
    yesterday: 'Вчера',
    last7Days: 'Последние 7 дней',
    last30Days: 'Последние 30 дней',
    thisMonth: 'Этот месяц',
    lastMonth: 'Прошлый месяц',
    allTime: 'За всё время',
    cancel: 'Отмена',
    apply: 'Применить',
    clear: 'Очистить',
    close: 'Закрыть',
    notSelected: 'Период не выбран',
    selectEndDate: 'Выберите дату окончания',
    daysCount: (count) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return `${count} день`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} дня`;
      return `${count} дней`;
    },
    quickDays: (count) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return `+${count} день`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `+${count} дня`;
      return `+${count} дней`;
    },
    weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    prevMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    prevYear: 'Предыдущий год',
    nextYear: 'Следующий год',
  },
};

export function getPickerText(key, lang = 'uz', t = null, params = null) {
  if (t) {
    const translationKey = `platform.datePicker.${key}`;
    const res = t(translationKey, params || {});
    if (res && res !== translationKey) return res;
  }
  const normalizedLang = lang && lang.startsWith('ru') ? 'ru' : 'uz';
  const dict = I18N_FALLBACKS[normalizedLang] || I18N_FALLBACKS.uz;
  const entry = dict[key];
  if (typeof entry === 'function') {
    return entry(params?.count ?? 0);
  }
  return entry ?? key;
}
