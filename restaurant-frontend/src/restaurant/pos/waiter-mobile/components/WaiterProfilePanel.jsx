import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../components/ui';
import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../../shared/components/RestaurantThemeSwitch';
import '../styles/waiter-profile-panel.css';

/**
 * Waiter mobile profile sheet — my data + settings (fullscreen, theme, language).
 * Presentation only; callers own open state and fullscreen preference.
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
  if (!open) return null;

  return (
    <div className="rst-waiter-profile" role="dialog" aria-modal="true" aria-labelledby="rst-waiter-profile-title">
      <button type="button" className="rst-waiter-profile__backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="rst-waiter-profile__sheet">
        <header className="rst-waiter-profile__head">
          <h2 id="rst-waiter-profile-title">{t('rst.waiter.profile.title')}</h2>
          <BaseButton type="button" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </BaseButton>
        </header>

        <section className="rst-waiter-profile__section" aria-labelledby="rst-waiter-profile-data">
          <h3 id="rst-waiter-profile-data">{t('rst.waiter.profile.myData')}</h3>
          <dl className="rst-waiter-profile__dl">
            <div>
              <dt>{t('rst.waiter.profile.name')}</dt>
              <dd>{displayName || '—'}</dd>
            </div>
            <div>
              <dt>{t('rst.waiter.profile.role')}</dt>
              <dd>{roleLabel || t('roles.WAITER')}</dd>
            </div>
            <div>
              <dt>{t('rst.waiter.profile.store')}</dt>
              <dd>{storeName || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rst-waiter-profile__section" aria-labelledby="rst-waiter-profile-settings">
          <h3 id="rst-waiter-profile-settings">{t('rst.waiter.profile.settings')}</h3>

          <label className="rst-waiter-profile__toggle">
            <span>
              <strong>{t('rst.waiter.profile.fullscreen')}</strong>
              <small>
                {fullscreenSupported
                  ? t('rst.waiter.profile.fullscreenHint')
                  : t('rst.waiter.profile.fullscreenUnsupported')}
              </small>
            </span>
            <input
              type="checkbox"
              checked={Boolean(fullscreenPreferred)}
              disabled={!fullscreenSupported && !fullscreenPreferred}
              onChange={(e) => onFullscreenChange?.(e.target.checked)}
            />
          </label>

          {showExitMobile ? (
            <BaseButton
              type="button"
              variant="ghost"
              className="rst-waiter-profile__exit-mobile"
              onClick={() => {
                onExitMobile?.();
                onClose?.();
              }}
            >
              {t('rst.waiter.profile.exitMobile')}
            </BaseButton>
          ) : null}

          {pwa?.canPrompt ? (
            <BaseButton
              type="button"
              variant="ghost"
              className="rst-waiter-profile__exit-mobile"
              onClick={() => pwa.install?.()}
            >
              {t('rst.waiter.profile.addToHome')}
            </BaseButton>
          ) : null}

          {pwa?.showManualHint ? (
            <p className="rst-waiter-profile__pwa-hint">{t('rst.waiter.profile.addToHomeHint')}</p>
          ) : null}

          {pwa?.installed ? (
            <p className="rst-waiter-profile__pwa-hint">{t('rst.waiter.profile.installedHint')}</p>
          ) : null}

          <div className="rst-waiter-profile__row">
            <span>{t('rst.theme')}</span>
            <RestaurantThemeSwitch />
          </div>

          <div className="rst-waiter-profile__row">
            <span>{t('rst.waiter.profile.language')}</span>
            <LanguageSwitcher variant="rst" />
          </div>
        </section>

        <footer className="rst-waiter-profile__foot">
          {canAdmin ? (
            <Link to="/rst/admin/dashboard" className="rst-waiter-profile__admin" onClick={onClose}>
              <BaseButton type="button" variant="ghost">{t('rst.pos.backToAdmin')}</BaseButton>
            </Link>
          ) : null}
          <BaseButton type="button" variant="ghost" className="rst-exit-btn" onClick={onLogout}>
            {t('nav.logout')}
          </BaseButton>
        </footer>
      </div>
    </div>
  );
}
