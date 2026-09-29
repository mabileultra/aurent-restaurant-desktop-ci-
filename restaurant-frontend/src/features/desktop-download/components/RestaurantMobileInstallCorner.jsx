import { useEffect, useRef, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWaiterPwaInstall } from '../../../restaurant/pos/waiter-mobile/hooks/useWaiterPwaInstall';
import '../../../styles/desktop-download/restaurant-mobile-install-corner.css';

function hintKey(platform) {
  if (platform === 'ios') return 'rst.waiter.profile.addToHomeIos';
  if (platform === 'android') return 'rst.waiter.profile.addToHomeAndroid';
  return 'rst.waiter.profile.addToHomeHint';
}

/** Login header: install restaurant PWA on the phone (no separate APK store build). */
export default function RestaurantMobileInstallCorner() {
  const { t } = useTranslation();
  const pwa = useWaiterPwaInstall({ enabled: true });
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const isDesktopShell = typeof window !== 'undefined'
    && Boolean(window.desktopCashier?.isDesktop);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isDesktopShell || pwa.installed) return null;

  return (
    <div className="rst-mobile-install" ref={rootRef}>
      <button
        type="button"
        className="rst-mobile-install__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t('rst.mobileDownload.aria')}
        onClick={() => setOpen((v) => !v)}
      >
        <Smartphone size={16} aria-hidden />
        <span>{t('rst.mobileDownload.short')}</span>
      </button>

      {open ? (
        <div className="rst-mobile-install__panel" role="dialog" aria-label={t('rst.mobileDownload.aria')}>
          <div className="rst-mobile-install__head">
            <strong>{t('rst.mobileDownload.title')}</strong>
            <button
              type="button"
              className="rst-mobile-install__close"
              aria-label={t('common.close', { defaultValue: 'Закрыть' })}
              onClick={() => setOpen(false)}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          <p className="rst-mobile-install__text">{t(hintKey(pwa.platform))}</p>
          {pwa.canPrompt ? (
            <button
              type="button"
              className="rst-mobile-install__cta"
              onClick={async () => {
                const ok = await pwa.install?.();
                if (ok) setOpen(false);
              }}
            >
              <Smartphone size={16} aria-hidden />
              {t('rst.waiter.profile.addToHome')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
