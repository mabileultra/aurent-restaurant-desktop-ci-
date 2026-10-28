import React from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * Global floating connectivity banner.
 * - Shows an amber warning card when user is offline (Wi-Fi disconnected).
 * - Provides immediate feedback and a 44px touch-friendly retry button.
 * - Automatically turns emerald when connection restores, then gently auto-dismisses.
 */
export default function GlobalOfflineBanner({ networkStatusOverride } = {}) {
  const { t } = useTranslation();
  const internalStatus = useNetworkStatus();
  const status = networkStatusOverride || internalStatus;

  const {
    isOffline,
    wasOffline,
    isChecking,
    checkConnection,
    dismissReconnected,
  } = status;

  // Nothing to display if user is online and wasn't recently offline
  if (!isOffline && !wasOffline) {
    return null;
  }

  const isReconnected = !isOffline && wasOffline;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[94vw] max-w-lg transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-4"
    >
      <div
        className={`rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md border flex items-center justify-between gap-3 text-white transition-colors duration-200 ${
          isReconnected
            ? 'bg-emerald-600/95 dark:bg-emerald-700/95 border-emerald-400/40 shadow-emerald-900/20'
            : 'bg-amber-600/95 dark:bg-amber-700/95 border-amber-400/40 shadow-amber-900/20'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isReconnected
                ? 'bg-emerald-500/40 text-emerald-100 ring-1 ring-emerald-300/30'
                : 'bg-amber-500/40 text-amber-100 ring-1 ring-amber-300/30'
            }`}
          >
            {isReconnected ? (
              <Wifi className="w-5 h-5 animate-pulse" />
            ) : (
              <WifiOff className="w-5 h-5 animate-bounce" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-tight truncate">
              {isReconnected
                ? t('errors.onlineRestored', { defaultValue: 'Internet aloqasi tiklandi' })
                : t('errors.wifiOffline', { defaultValue: 'Internet aloqasi uzildi' })}
            </span>
            <span className="text-xs text-white/85 truncate">
              {isReconnected
                ? t('errors.onlineRestoredDesc', { defaultValue: 'Barcha ma’lumotlar sinxronlanmoqda' })
                : t('errors.offlineBannerDesc', { defaultValue: 'Qurilma oflayn. Wi-Fi yoki tarmoqni tekshiring' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOffline && (
            <button
              type="button"
              disabled={isChecking}
              onClick={checkConnection}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-semibold text-white transition-all disabled:opacity-50 touch-manipulation focus:outline-hidden focus:ring-2 focus:ring-white/50"
              title={t('errors.networkRetry', { defaultValue: 'Qayta tekshirish' })}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isChecking
                  ? t('errors.networkChecking', { defaultValue: 'Tekshirilmoqda…' })
                  : t('errors.networkRetry', { defaultValue: 'Qayta tekshirish' })}
              </span>
            </button>
          )}

          {isReconnected && (
            <button
              type="button"
              onClick={dismissReconnected}
              className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition-all touch-manipulation focus:outline-hidden focus:ring-2 focus:ring-white/50"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
