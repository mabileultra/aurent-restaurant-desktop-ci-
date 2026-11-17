import React from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseApiError } from '../../utils/apiErrorParser';

/**
 * Universal error state display for tables, sections, widgets and full pages.
 */
export default function PlatformErrorState({
  error,
  title,
  description,
  onRetry,
  retryLabel,
  retryLoading = false,
  action,
  size = 'md',
  className = '',
}) {
  const { t } = useTranslation();

  const parsed = error ? parseApiError(error) : null;
  const isClientError = Boolean(
    parsed?.isClientError
      || (error && !parsed?.isNetwork && !parsed?.status && (error instanceof Error || error?.name)),
  );

  const displayTitle = title || (
    parsed?.isNetwork
      ? t('errors.networkTitle', { defaultValue: 'Tarmoq xatosi' })
      : parsed?.isForbidden
        ? t('errors.forbiddenTitle', { defaultValue: 'Ruxsat cheklangan' })
        : isClientError
          ? t('errors.clientErrorTitle', { defaultValue: 'Sahifada xatolik yuz berdi' })
          : t('errors.loadFailedTitle', { defaultValue: 'Ma’lumotlarni yuklab bo‘lmadi' })
  );

  const displayDescription = description || parsed?.message || t('errors.general', {
    defaultValue: 'Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.',
  });

  const code = parsed?.code;

  let Icon = AlertTriangle;
  let iconTone = 'text-warning-text bg-warning-soft border-warning/30';

  if (parsed?.isNetwork || (parsed?.status && parsed.status >= 500)) {
    Icon = parsed?.isNetwork ? WifiOff : AlertTriangle;
    iconTone = 'text-danger-text bg-danger-soft border-danger/30';
  } else if (parsed?.isForbidden) {
    Icon = ShieldAlert;
    iconTone = 'text-danger-text bg-danger-soft border-danger/30';
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
      <div
        className={`inline-flex items-center justify-center rounded-control border ${iconTone} ${
          isSmall ? 'w-9 h-9 p-2' : isLarge ? 'w-14 h-14 p-3.5' : 'w-11 h-11 p-2.5'
        }`}
      >
        <Icon className="w-full h-full" strokeWidth={1.75} aria-hidden="true" />
      </div>

      <div className="max-w-md space-y-1">
        <h4
          className={`font-semibold text-ink ${
            isSmall ? 'text-xs' : isLarge ? 'text-lg' : 'text-sm'
          }`}
        >
          {displayTitle}
        </h4>
        <p
          className={`text-ink-muted ${
            isSmall ? 'text-xs leading-snug' : 'text-xs leading-relaxed'
          }`}
        >
          {displayDescription}
        </p>
        {code && (
          <div className="pt-0.5">
            <span
              className="ui-badge-neutral font-mono text-[11px] select-all"
              title={t('errors.codeHelp', { defaultValue: 'Qo‘llab-quvvatlash uchun xato kodi' })}
            >
              {code}
            </span>
          </div>
        )}
      </div>

      {(onRetry || action) && (
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
          {onRetry && (
            <button
              type="button"
              disabled={retryLoading}
              onClick={onRetry}
              className="ui-btn ui-btn-primary ui-btn-sm"
            >
              <RotateCcw
                size={isSmall ? 12 : 14}
                strokeWidth={1.75}
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
