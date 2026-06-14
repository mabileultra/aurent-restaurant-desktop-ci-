import type { TFunction } from 'i18next';

export function formatMoney(value: number | string | null | undefined, t: TFunction): string {
  const num = Number(value ?? 0);
  const formatted = num.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} ${t('common.currency')}`;
}

export function formatMoneyCompact(value: number | string | null | undefined, t: TFunction): string {
  const num = Number(value ?? 0);
  if (Math.abs(num) >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${millions.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${t('common.million')} ${t('common.currency')}`;
  }
  return formatMoney(num, t);
}
