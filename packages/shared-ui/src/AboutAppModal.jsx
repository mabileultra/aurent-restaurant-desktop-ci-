import React, { useEffect } from 'react';
import { getAppVersionInfo } from '@aurent/shared-fiscal';

/**
 * Universal «Dastur haqida» (About Dialog) oynasi.
 *
 * @param {object} props
 * @param {boolean} props.open - oyna ochiq yoki yopiq
 * @param {() => void} props.onClose - yopish callbacki
 * @param {string} [props.appName] - ilova nomi
 * @param {string} [props.fmNumber] - fiskal modul raqami
 * @param {string} [props.licenseNumber] - litsenziya raqami (agar bo'sh bo'lsa qator ko'rsatilmaydi)
 * @param {Function} [props.t] - i18n tarjimon funksiyasi
 */
export default function AboutAppModal({
  open,
  onClose,
  appName = 'Aurent POS',
  fmNumber = '',
  licenseNumber = '',
  t,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const versionInfo = getAppVersionInfo();
  const tr = (key, fallback, options) => {
    if (typeof t === 'function') {
      const res = t(key, options);
      if (res && res !== key) return res;
    }
    return fallback;
  };

  const title = tr('desktop.aboutApp', tr('about.title', 'Dastur haqida'));
  const versionLabel = tr('fiscalReceipt.appVersion', tr('about.version', 'Dastur versiyasi'));
  const desktopVersionLabel = tr(
    'desktop.aboutDesktopVersion',
    tr('about.desktopVersion', 'Desktop versiyasi')
  );
  const uiVersionLabel = tr(
    'desktop.aboutUiVersion',
    tr('about.uiVersion', 'UI versiyasi')
  );
  const fmLabel = tr('fiscalReceipt.fmNumber', tr('about.fmNumber', 'FM raqami'));
  const licenseLabel = tr('about.licenseNumber', 'Litsenziya raqami');
  const platformLabel = versionInfo.isDesktop
    ? tr('about.platformDesktop', 'Desktop ilova')
    : tr('about.platformWeb', 'Veb versiya');
  const closeLabel = tr('common.close', 'Yopish');

  const resolvedFm = String(
    fmNumber ||
    (typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_FISCAL_MODULE_NUMBER || import.meta.env?.VITE_FISCAL_CARD_ID
      : '') ||
    ''
  ).trim();

  const resolvedLicense = String(licenseNumber || '').trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      style={{ zIndex: 12000 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-dialog-title"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <div>
              <h2 id="about-dialog-title" className="text-base font-semibold leading-tight">
                {title}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {appName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label={closeLabel}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="py-4 space-y-3 text-sm">
          {versionInfo.isDesktop ? (
            <>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">{desktopVersionLabel}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  {versionInfo.desktopVersion || versionInfo.version || '1.0.0'}
                </span>
              </div>
              {versionInfo.uiVersion ? (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">{uiVersionLabel}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    {versionInfo.uiVersion}
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">{versionLabel}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {versionInfo.version || '1.0.0'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400">Platforma</span>
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {platformLabel}
            </span>
          </div>

          {resolvedFm ? (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">{fmLabel}</span>
              <span className="font-mono text-slate-900 dark:text-slate-100 font-medium">
                {resolvedFm}
              </span>
            </div>
          ) : null}

          {resolvedLicense ? (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">{licenseLabel}</span>
              <span className="font-mono text-slate-900 dark:text-slate-100 font-medium">
                {resolvedLicense}
              </span>
            </div>
          ) : null}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex h-11 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
