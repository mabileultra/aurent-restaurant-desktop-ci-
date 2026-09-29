import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Monitor, Smartphone, Store, X } from 'lucide-react';
import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../../shared/components/RestaurantThemeSwitch';
import '../styles/waiter-profile-panel.css';

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

function installHintKey(platform, iosNeedsSafari) {
  if (platform === 'ios' && iosNeedsSafari) return 'rst.waiter.profile.addToHomeIosSafari';
  if (platform === 'ios') return 'rst.waiter.profile.addToHomeIos';
  if (platform === 'android') return 'rst.waiter.profile.addToHomeAndroid';
  return 'rst.waiter.profile.addToHomeHint';
}

/**
 * Waiter mobile profile — compact bottom sheet (portaled to body).
 */
export default function WaiterProfilePanel({
  open,
  onClose,
  displayName,
  storeName,
  roleLabel,
  canAdmin = false,
  canCashier = false,
  fullscreenPreferred,
  fullscreenSupported,
  onFullscreenChange,
  showExitMobile,
  onExitMobile,
  pwa,
  onLogout,
}) {
  const { t } = useTranslation();
  if (!open || typeof document === 'undefined') return null;

  const name = displayName || t('rst.waiter.profile.title');
  const role = roleLabel || t('roles.WAITER');
  const fullscreenOff = !fullscreenSupported && !fullscreenPreferred;
  const showInstall = pwa?.enabled && !pwa?.installed;

  const sheet = (
    <div className="rst-waiter-profile" role="dialog" aria-modal="true" aria-labelledby="rst-waiter-profile-title">
      <button type="button" className="rst-waiter-profile__backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="rst-waiter-profile__sheet">
        <div className="rst-waiter-profile__grab" aria-hidden />

        <header className="rst-waiter-profile__head">
          <div className="rst-waiter-profile__avatar" aria-hidden>{initialsFromName(name)}</div>
          <div className="rst-waiter-profile__who">
            <h2 id="rst-waiter-profile-title">{name}</h2>
            <div className="rst-waiter-profile__meta">
              <span className="rst-waiter-profile__badge">{role}</span>
              {storeName ? <span className="rst-waiter-profile__store">{storeName}</span> : null}
            </div>
          </div>
          <button type="button" className="rst-waiter-profile__close" aria-label={t('common.close')} onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <section className="rst-waiter-profile__card" aria-label={t('rst.waiter.profile.title')}>
          <label className={`rst-waiter-profile__item${fullscreenOff ? ' is-disabled' : ''}`}>
            <span className="rst-waiter-profile__item-text">
              <span className="rst-waiter-profile__item-icon" aria-hidden><Monitor size={16} /></span>
              {t('rst.waiter.profile.fullscreen')}
            </span>
            <span className="rst-waiter-profile__toggle">
              <input
                type="checkbox"
                checked={Boolean(fullscreenPreferred)}
                disabled={fullscreenOff}
                onChange={(e) => onFullscreenChange?.(e.target.checked)}
              />
              <span className="rst-waiter-profile__toggle-ui" aria-hidden />
            </span>
          </label>

          <div className="rst-waiter-profile__item">
            <span className="rst-waiter-profile__item-text">{t('rst.theme')}</span>
            <RestaurantThemeSwitch />
          </div>

          <div className="rst-waiter-profile__item">
            <span className="rst-waiter-profile__item-text">{t('rst.waiter.profile.language')}</span>
            <LanguageSwitcher variant="rst" />
          </div>

          {showExitMobile ? (
            <button
              type="button"
              className="rst-waiter-profile__item rst-waiter-profile__item--action"
              onClick={() => { onExitMobile?.(); onClose?.(); }}
            >
              <span className="rst-waiter-profile__item-text">
                <span className="rst-waiter-profile__item-icon" aria-hidden><Monitor size={16} /></span>
                {t('rst.waiter.profile.exitMobile')}
              </span>
            </button>
          ) : null}
        </section>

        {showInstall ? (
          <section className="rst-waiter-profile__install" aria-label={t('rst.waiter.profile.addToHome')}>
            {pwa?.canPrompt ? (
              <button
                type="button"
                className="rst-waiter-profile__install-btn"
                onClick={() => pwa.install?.()}
              >
                <Smartphone size={16} aria-hidden />
                {t('rst.waiter.profile.addToHome')}
              </button>
            ) : null}
            <p className="rst-waiter-profile__hint">
              {t(installHintKey(pwa?.platform, pwa?.iosNeedsSafari), {
                defaultValue: t('rst.waiter.profile.addToHomeHint'),
              })}
            </p>
          </section>
        ) : null}

        <footer className="rst-waiter-profile__foot">
          {canCashier ? (
            <Link to="/rst/cashier" className="rst-waiter-profile__nav" onClick={onClose}>
              <Store size={16} aria-hidden />
              {t('rst.waiter.profile.openCashier')}
            </Link>
          ) : null}
          {canAdmin ? (
            <Link to="/rst/admin/dashboard" className="rst-waiter-profile__admin" onClick={onClose}>
              {t('rst.pos.backToAdmin')}
            </Link>
          ) : null}
          <button type="button" className="rst-waiter-profile__logout" onClick={onLogout}>
            <LogOut size={16} aria-hidden />
            {t('nav.logout')}
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
