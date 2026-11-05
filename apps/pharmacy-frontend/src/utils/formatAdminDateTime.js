import { format, parseISO } from 'date-fns';

/** Admin tables: dd.MM.yyyy HH:mm, or em dash if empty/invalid. */
export function formatAdminDateTime(iso) {
  if (iso == null || iso === '') return '—';
  try {
    const date = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'dd.MM.yyyy HH:mm');
  } catch {
    return '—';
  }
}
