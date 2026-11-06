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
 * Sahifa yoki ro'yxatning oxirgi yangilangan vaqtini ko'rsatuvchi yengil nishon (P2).
 * Agar timestamp berilmasa, hech narsa ko'rsatilmaydi (yolg'on joriy vaqt ko'rsatish man etiladi).
 */
export default function LastUpdatedBadge({ timestamp, className = '' }) {
  const { t } = useTranslation();
  if (!timestamp) return null;

  const timeStr = formatTime(timestamp);
  if (!timeStr) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 ${className}`}
      title={t('common.lastUpdated', { defaultValue: 'Oxirgi yangilanish' })}
    >
      <Clock size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
      <span>{t('common.lastUpdatedPrefix', { defaultValue: 'Oxirgi yangilanish:' })} {timeStr}</span>
    </span>
  );
}
