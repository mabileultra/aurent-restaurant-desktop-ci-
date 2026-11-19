import React from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ConnectionStatus } from '../../store/networkStore';

export default function GlobalOfflineBanner({ networkStatusOverride } = {}) {
  const { t } = useTranslation();
  const internalStatus = useNetworkStatus();
  const statusObj = networkStatusOverride || internalStatus;

  const {
    status,
    isOffline,
    isServerDown,
    isChecking,
    isProbing,
    wasOffline,
    checkConnection,
    dismissReconnected,
  } = statusObj;

  if (isChecking || status === ConnectionStatus.CHECKING) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[99999] bg-warning-soft border-b border-warning/30 text-warning-text px-3 py-1 text-center text-xs font-semibold flex items-center justify-center gap-1.5"
      >
        <RefreshCw className="w-3 h-3 animate-spin shrink-0" strokeWidth={1.75} />
        <span>{t('errors.networkChecking', { defaultValue: 'Aloqa sekin, tekshirilmoqda…' })}</span>
      </div>
    );
  }

  if (!isOffline && !isServerDown && !wasOffline && status !== ConnectionStatus.RECONNECTED) {
    return null;
  }

  const isReconnected = wasOffline || status === ConnectionStatus.RECONNECTED;

  let bannerTone = 'bg-danger border-danger-text/30 text-surface';
  let bannerIcon = <WifiOff className="w-5 h-5" strokeWidth={1.75} />;
  let iconBg = 'bg-surface/20 text-surface';
  let titleText = t('errors.wifiOffline', { defaultValue: 'Internet uzildi. Ma’lumotlar saqlanmaydi' });
  let descText = t('errors.offlineBannerDesc', { defaultValue: 'Wi-Fi yoki tarmoq kabelini tekshiring' });

  if (isReconnected) {
    bannerTone = 'bg-primary-500 border-primary-600 text-surface';
    bannerIcon = <Wifi className="w-5 h-5" strokeWidth={1.75} />;
    iconBg = 'bg-surface/20 text-surface';
    titleText = t('errors.onlineRestored', { defaultValue: 'Aloqa tiklandi, ma’lumotlar yangilandi' });
    descText = t('errors.onlineRestoredDesc', { defaultValue: 'Barcha ma’lumotlar sinxronlanmoqda' });
  } else if (isServerDown) {
    bannerTone = 'bg-warning-soft border-warning/40 text-warning-text';
    bannerIcon = <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />;
    iconBg = 'bg-warning/20 text-warning-text';
    titleText = t('errors.serverDown', { defaultValue: 'Server bilan aloqa yo’q. Biroz kuting' });
    descText = t('errors.serverDownDesc', { defaultValue: 'Internet ulanishi yoki server holatini tekshiring' });
  }

  const ariaRole = isReconnected ? 'status' : 'alert';
  const ariaLive = isReconnected ? 'polite' : 'assertive';
  const actionBtnClass = isServerDown
    ? 'bg-surface text-ink border border-warning/40 hover:bg-warning/10'
    : 'bg-surface/20 hover:bg-surface/30 text-surface';

  return (
    <div
      role={ariaRole}
      aria-live={ariaLive}
      tabIndex={-1}
      className="fixed top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-[99999] w-[95vw] max-w-xl transition-all duration-200 ease-out focus:outline-none pointer-events-auto"
    >
      <div className={`rounded-card px-4 py-3 shadow-elevated border flex items-center justify-between gap-3 transition-colors duration-200 ${bannerTone}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${iconBg}`}>
            {bannerIcon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-tight leading-snug break-words">{titleText}</span>
            <span className="text-xs opacity-90 leading-normal break-words mt-0.5">{descText}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(isOffline || isServerDown) && (
            <button
              type="button"
              onClick={checkConnection}
              disabled={isProbing}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-control text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${actionBtnClass}`}
              title={t('errors.networkRetry', { defaultValue: 'Qayta tekshirish' })}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              <span className="hidden sm:inline">{t('errors.networkRetry', { defaultValue: 'Qayta tekshirish' })}</span>
            </button>
          )}

          {isReconnected && (
            <button
              type="button"
              onClick={dismissReconnected}
              className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-control bg-surface/15 hover:bg-surface/25 text-surface transition-colors cursor-pointer"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
