/** Компактные суммы для KPI/топов (сум). */
export function formatAnalyticsMoney(value, t) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1e9) {
    return `${sign}${(abs / 1e9).toLocaleString('ru-RU', { maximumFractionDigits: 2, minimumFractionDigits: 1 })} ${t('platform.analytics.units.billion')}`;
  }
  if (abs >= 1e6) {
    return `${sign}${Math.round(abs / 1e6).toLocaleString('ru-RU')} ${t('platform.analytics.units.million')}`;
  }
  if (abs >= 1e3) {
    return `${sign}${Math.round(abs / 1e3).toLocaleString('ru-RU')}k`;
  }
  return `${sign}${Math.round(abs).toLocaleString('ru-RU')}`;
}

export function formatAnalyticsCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('ru-RU');
}

export function formatAnalyticsDelta(deltaPct) {
  if (deltaPct == null || !Number.isFinite(Number(deltaPct))) return null;
  const n = Number(deltaPct);
  const arrow = n > 0 ? '↑' : n < 0 ? '↓' : '·';
  return `${arrow} ${Math.abs(n).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}
