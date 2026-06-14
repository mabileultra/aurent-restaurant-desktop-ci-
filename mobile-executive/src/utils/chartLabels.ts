import type { ExecutivePeriod } from '../api/types';

export function formatChartDayLabel(dateIso: string, period: ExecutivePeriod, locale: string): string {
  const date = new Date(dateIso);
  if (period === 'MONTH') {
    return date.toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU', { day: '2-digit', month: '2-digit' });
  }
  return date
    .toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU', { weekday: 'short' })
    .slice(0, 2)
    .toUpperCase();
}
