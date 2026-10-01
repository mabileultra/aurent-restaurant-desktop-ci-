import { useEffect, useRef, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWaiterPwaInstall } from '../../../restaurant/pos/waiter-mobile/hooks/useWaiterPwaInstall';
import '../../../styles/desktop-download/restaurant-mobile-install-corner.css';

function installHintKey(pwa) {
  if (pwa.platform === 'ios' && pwa.iosNeedsSafari) {
    return 'rst.waiter.profile.addToHomeIosSafari';
  }
  if (pwa.platform === 'ios') return 'rst.waiter.profile.addToHomeIos';
  if (pwa.platform === 'android') return 'rst.waiter.profile.addToHomeAndroid';
  return 'rst.waiter.profile.addToHomeHint';
}

/** Login header: install restaurant PWA on the phone (no separate APK/App Store build). */
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
    // pointerdown (not touchstart) — touchstart on document can fight page scroll on phones.
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isDesktopShell || pwa.installed) return null;

  const isIos = pwa.platform === 'ios';

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

          <p className="rst-mobile-install__text">{t(installHintKey(pwa))}</p>

          {isIos && !pwa.iosNeedsSafari ? (
            <ol className="rst-mobile-install__steps">
              <li>{t('rst.mobileDownload.iosStep1')}</li>
              <li>{t('rst.mobileDownload.iosStep2')}</li>
              <li>{t('rst.mobileDownload.iosStep3')}</li>
            </ol>
          ) : null}

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

          {isIos ? (
            <p className="rst-mobile-install__note">{t('rst.mobileDownload.iosNoStore')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
