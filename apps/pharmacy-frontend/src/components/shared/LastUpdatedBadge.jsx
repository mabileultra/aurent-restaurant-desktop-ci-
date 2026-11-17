import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Light last-updated timestamp badge.
 */
export default function LastUpdatedBadge({ timestamp, className = '' }) {
  const { t } = useTranslation();
  if (!timestamp) return null;

  const timeStr = formatTime(timestamp);
  if (!timeStr) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium text-ink-muted ui-tabular ${className}`}
      title={t('common.lastUpdated', { defaultValue: 'Oxirgi yangilanish' })}
    >
      <Clock size={12} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
      <span>{t('common.lastUpdatedPrefix', { defaultValue: 'Oxirgi yangilanish:' })} {timeStr}</span>
    </span>
  );
}
