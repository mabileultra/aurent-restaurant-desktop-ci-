import React from 'react';

export function AnalyticsDelta({ value, suffix = '%' }) {
  if (value == null) return <span className="ta-neutral">—</span>;
  const n = Number(value);
  const cls = n > 0 ? 'ta-up' : n < 0 ? 'ta-down' : 'ta-neutral';
  const arrow = n > 0 ? '↑' : n < 0 ? '↓' : '';
  return <span className={cls}>{arrow} {Math.abs(n).toLocaleString('ru-RU')}{suffix}</span>;
}

export function AnalyticsShare({ value, tone = 'green' }) {
  if (value == null) return <span className="ta-muted">—</span>;
  return <span className={`ta-badge ta-badge-${tone}`}>{Number(value).toLocaleString('ru-RU')}%</span>;
}
