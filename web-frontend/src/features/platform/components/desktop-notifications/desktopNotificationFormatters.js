import { format, formatDistanceToNow } from 'date-fns';
import { ru, uz } from 'date-fns/locale';

export function resolveLocale(lang) {
  return lang?.startsWith('uz') ? uz : ru;
}

export function formatUzbekDate(iso, pattern, lang) {
  try {
    const d = new Date(iso);
    const res = format(d, pattern, { locale: resolveLocale(lang) });
    return lang?.startsWith('uz')
      ? res.replace(/-([A-ZА-ЯЁ][a-zа-яё]+)/g, (_m, p1) => `-${p1.toLowerCase()}`)
      : res;
  } catch {
    return '—';
  }
}

export function formatDateFull(iso, lang) {
  return formatUzbekDate(iso, 'd-MMMM yyyy, HH:mm', lang);
}

export function formatRelative(iso, lang) {
  try {
    const d = new Date(iso);
    const res = formatDistanceToNow(d, { addSuffix: true, locale: resolveLocale(lang) });
    return res.replace(/^(?:taxminan|tahminan)\s+/i, '');
  } catch {
    return '';
  }
}
