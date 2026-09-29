import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../../shared/components/RestaurantThemeSwitch';
import '../styles/waiter-profile-panel.css';

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

  const sheet = (
    <div className="rst-waiter-profile" role="dialog" aria-modal="true" aria-labelledby="rst-waiter-profile-title">
      <button type="button" className="rst-waiter-profile__backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="rst-waiter-profile__sheet">
        <div className="rst-waiter-profile__grab" aria-hidden />

        <header className="rst-waiter-profile__head">
          <div className="rst-waiter-profile__who">
            <h2 id="rst-waiter-profile-title">{displayName || t('rst.waiter.profile.title')}</h2>
            <p>
              {roleLabel || t('roles.WAITER')}
              {storeName ? ` · ${storeName}` : ''}
            </p>
          </div>
          <button type="button" className="rst-waiter-profile__close" aria-label={t('common.close')} onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="rst-waiter-profile__quick">
          <label className="rst-waiter-profile__switch">
            <span>{t('rst.waiter.profile.fullscreen')}</span>
            <input
              type="checkbox"
              checked={Boolean(fullscreenPreferred)}
              disabled={!fullscreenSupported && !fullscreenPreferred}
              onChange={(e) => onFullscreenChange?.(e.target.checked)}
            />
          </label>

          {showExitMobile ? (
            <button type="button" className="rst-waiter-profile__link" onClick={() => { onExitMobile?.(); onClose?.(); }}>
              {t('rst.waiter.profile.exitMobile')}
            </button>
          ) : null}

          {pwa?.canPrompt ? (
            <button type="button" className="rst-waiter-profile__link" onClick={() => pwa.install?.()}>
              {t('rst.waiter.profile.addToHome')}
            </button>
          ) : null}
        </div>

        {pwa?.showManualHint ? (
          <p className="rst-waiter-profile__hint">{t('rst.waiter.profile.addToHomeHint')}</p>
        ) : null}

        <div className="rst-waiter-profile__row">
          <span>{t('rst.theme')}</span>
          <RestaurantThemeSwitch />
        </div>

        <div className="rst-waiter-profile__row">
          <span>{t('rst.waiter.profile.language')}</span>
          <LanguageSwitcher variant="rst" />
        </div>

        <footer className="rst-waiter-profile__foot">
          {canAdmin ? (
            <Link to="/rst/admin/dashboard" className="rst-waiter-profile__admin" onClick={onClose}>
              {t('rst.pos.backToAdmin')}
            </Link>
          ) : null}
          <BaseButton type="button" variant="ghost" className="rst-waiter-profile__logout" onClick={onLogout}>
            {t('nav.logout')}
          </BaseButton>
        </footer>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
