import React from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ConnectionStatus } from '../../store/networkStore';

/**
 * Global tarmoq holati banneri (P0/P1)
 * 4 ta aniq holat: Aloqa tekshirilmoqda, Internet yo'q, Server ishlamayapti, Aloqa tiklandi
 */
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

  // 1. Aloqa tekshirilmoqda — ingichka sariq chiziq
  if (isChecking || status === ConnectionStatus.CHECKING) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[99999] bg-amber-400 text-amber-950 px-3 py-1 text-center text-xs font-semibold shadow-xs animate-pulse flex items-center justify-center gap-1.5"
      >
        <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
        <span>{t('errors.networkChecking', { defaultValue: 'Aloqa sekin, tekshirilmoqda…' })}</span>
      </div>
    );
  }

  // Onlayn va avval oflayn bo'lmagan bo'lsa hech narsa ko'rsatilmaydi
  if (!isOffline && !isServerDown && !wasOffline && status !== ConnectionStatus.RECONNECTED) {
    return null;
  }

  const isReconnected = wasOffline || status === ConnectionStatus.RECONNECTED;

  // Semantik ranglar va matnlar
  let bannerBg = 'bg-rose-600/95 dark:bg-rose-700/95 border-rose-400/40 shadow-rose-900/20';
  let bannerIcon = <WifiOff className="w-5 h-5 animate-bounce" />;
  let iconBg = 'bg-rose-500/40 text-rose-100 ring-1 ring-rose-300/30';
  let titleText = t('errors.wifiOffline', { defaultValue: 'Internet uzildi. Ma’lumotlar saqlanmaydi' });
  let descText = t('errors.offlineBannerDesc', { defaultValue: 'Wi-Fi yoki tarmoq kabelini tekshiring' });

  if (isReconnected) {
    bannerBg = 'bg-emerald-600/95 dark:bg-emerald-700/95 border-emerald-400/40 shadow-emerald-900/20';
    bannerIcon = <Wifi className="w-5 h-5 animate-pulse" />;
    iconBg = 'bg-emerald-500/40 text-emerald-100 ring-1 ring-emerald-300/30';
    titleText = t('errors.onlineRestored', { defaultValue: 'Aloqa tiklandi, ma’lumotlar yangilandi' });
    descText = t('errors.onlineRestoredDesc', { defaultValue: 'Barcha ma’lumotlar sinxronlanmoqda' });
  } else if (isServerDown) {
    bannerBg = 'bg-amber-600/95 dark:bg-amber-700/95 border-amber-400/40 shadow-amber-900/20';
    bannerIcon = <AlertTriangle className="w-5 h-5" />;
    iconBg = 'bg-amber-500/40 text-amber-100 ring-1 ring-amber-300/30';
    titleText = t('errors.serverDown', { defaultValue: 'Server bilan aloqa yo’q. Biroz kuting' });
    descText = t('errors.serverDownDesc', { defaultValue: 'Internet ulanishi yoki server holatini tekshiring' });
  }

  const ariaRole = isReconnected ? 'status' : 'alert';
  const ariaLive = isReconnected ? 'polite' : 'assertive';

  return (
    <div
      role={ariaRole}
      aria-live={ariaLive}
      tabIndex={-1}
      className="fixed top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-[99999] w-[95vw] max-w-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-4 focus:outline-none pointer-events-auto"
    >
      <div className={`rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md border flex items-center justify-between gap-3 text-white transition-colors duration-200 ${bannerBg}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {bannerIcon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-tight leading-snug break-words">{titleText}</span>
            <span className="text-xs text-white/90 leading-normal break-words mt-0.5">{descText}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(isOffline || isServerDown) && (
            <button
              type="button"
              onClick={checkConnection}
              disabled={isProbing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-semibold text-white transition-all touch-manipulation focus:outline-hidden focus:ring-2 focus:ring-white/50 cursor-pointer disabled:opacity-60"
              title={t('errors.networkRetry', { defaultValue: 'Qayta tekshirish' })}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('errors.networkRetry', { defaultValue: 'Qayta tekshirish' })}</span>
            </button>
          )}

          {isReconnected && (
            <button
              type="button"
              onClick={dismissReconnected}
              className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white transition-all touch-manipulation focus:outline-hidden focus:ring-2 focus:ring-white/50 cursor-pointer"
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
