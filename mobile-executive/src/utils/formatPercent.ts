export function formatPercent(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}

export function isPositiveTrend(value: number): boolean {
  return Number(value) >= 0;
}
