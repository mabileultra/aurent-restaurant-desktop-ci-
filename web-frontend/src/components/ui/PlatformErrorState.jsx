import React from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseApiError } from '../../utils/apiErrorParser';

/**
 * Universal error state display for tables, sections, widgets and full pages.
 * Supports auto-parsing API errors, retry callbacks, and support reference codes.
 */
export default function PlatformErrorState({
  error,
  title,
  description,
  onRetry,
  retryLabel,
  retryLoading = false,
  action,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const { t } = useTranslation();

  const parsed = error ? parseApiError(error) : null;
  const displayTitle = title || (
    parsed?.isNetwork
      ? t('errors.networkTitle', { defaultValue: 'Tarmoq xatosi' })
      : parsed?.isForbidden
      ? t('errors.forbiddenTitle', { defaultValue: 'Ruxsat cheklangan' })
      : t('errors.loadFailedTitle', { defaultValue: 'Ma’lumotlarni yuklab bo‘lmadi' })
  );

  const displayDescription = description || parsed?.message || t('errors.general', {
    defaultValue: 'Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.',
  });

  const code = parsed?.code;

  // Icon selection based on error nature
  let Icon = AlertTriangle;
  let iconTone = 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';

  if (parsed?.isNetwork) {
    Icon = WifiOff;
    iconTone = 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
  } else if (parsed?.isForbidden) {
    Icon = ShieldAlert;
    iconTone = 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/50';
  } else if (parsed?.status && parsed.status >= 500) {
    Icon = AlertTriangle;
    iconTone = 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center ${
        isSmall ? 'py-5 px-3 gap-2' : isLarge ? 'py-12 px-6 gap-4 min-h-[320px]' : 'py-8 px-4 gap-3'
      } ${className}`}
    >
      {/* Icon */}
      <div
        className={`inline-flex items-center justify-center rounded-xl border ${iconTone} ${
          isSmall ? 'w-9 h-9 p-2' : isLarge ? 'w-14 h-14 p-3.5' : 'w-11 h-11 p-2.5'
        }`}
      >
        <Icon className="w-full h-full" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="max-w-md space-y-1">
        <h4
          className={`font-bold text-slate-800 dark:text-slate-100 ${
            isSmall ? 'text-xs' : isLarge ? 'text-lg' : 'text-sm'
          }`}
        >
          {displayTitle}
        </h4>
        <p
          className={`text-slate-500 dark:text-slate-400 ${
            isSmall ? 'text-[11px] leading-snug' : 'text-xs leading-relaxed'
          }`}
        >
          {displayDescription}
        </p>
        {code && (
          <div className="pt-0.5">
            <span
              className="inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 select-all"
              title={t('errors.codeHelp', { defaultValue: 'Qo‘llab-quvvatlash uchun xato kodi' })}
            >
              {code}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {(onRetry || action) && (
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
          {onRetry && (
            <button
              type="button"
              disabled={retryLoading}
              onClick={onRetry}
              className={`inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none ${
                isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'
              }`}
            >
              <RotateCcw
                size={isSmall ? 12 : 14}
                className={retryLoading ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              <span>{retryLabel || t('common.retry', { defaultValue: 'Qayta urinish' })}</span>
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
