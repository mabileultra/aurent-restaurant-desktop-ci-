import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LogOut, Monitor, Smartphone, Store, Wifi, X } from 'lucide-react';
import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantThemeSwitch from '../../../shared/components/RestaurantThemeSwitch';
import {
  getConfiguredHubUrl,
  setConfiguredHubUrl,
} from '../../../../services/offline/waiterPwa/outboxSync';
import { discoverLanHubs } from '../../../../services/offline/discoverLanHubs';
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
  const [hubUrl, setHubUrl] = useState(() => getConfiguredHubUrl());
  const [hubBusy, setHubBusy] = useState(false);

  useEffect(() => {
    if (open) setHubUrl(getConfiguredHubUrl());
  }, [open]);

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

        <section className="rst-waiter-profile__card" aria-label="LAN Hub">
          <label className="rst-waiter-profile__item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span className="rst-waiter-profile__item-text">
              <span className="rst-waiter-profile__item-icon" aria-hidden><Wifi size={16} /></span>
              {t('rst.waiter.profile.hubUrl', { defaultValue: 'LAN Hub кассы' })}
            </span>
            <input
              type="url"
              className="rst-waiter-profile__hub-input"
              placeholder="http://192.168.x.x:8787"
              value={hubUrl}
              onChange={(e) => setHubUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--rst-border, #333)',
                background: 'transparent',
                color: 'inherit',
              }}
            />
            <button
              type="button"
              className="rst-waiter-profile__item rst-waiter-profile__item--action"
              disabled={hubBusy}
              onClick={async () => {
                setHubBusy(true);
                try {
                  const hits = await discoverLanHubs({ preferUrl: hubUrl || getConfiguredHubUrl() });
                  if (!hits.length) {
                    toast.error(t('rst.waiter.profile.hubDiscoverEmpty', {
                      defaultValue: 'Hub не найден в Wi‑Fi. Введите URL с кассы вручную',
                    }));
                    return;
                  }
                  const best = hits[0];
                  setConfiguredHubUrl(best.url);
                  setHubUrl(best.url);
                  toast.success(t('rst.waiter.profile.hubDiscoverOk', {
                    defaultValue: `Найден Hub: ${best.url}`,
                    url: best.url,
                  }));
                } catch {
                  toast.error(t('rst.waiter.profile.hubDiscoverFail', {
                    defaultValue: 'Поиск Hub не удался',
                  }));
                } finally {
                  setHubBusy(false);
                }
              }}
            >
              <span className="rst-waiter-profile__item-text">
                {t('rst.waiter.profile.hubDiscover', { defaultValue: 'Найти Hub в Wi‑Fi' })}
              </span>
            </button>
            <button
              type="button"
              className="rst-waiter-profile__item rst-waiter-profile__item--action"
              disabled={hubBusy}
              onClick={async () => {
                const next = String(hubUrl || '').trim().replace(/\/$/, '');
                setHubBusy(true);
                try {
                  if (!next) {
                    setConfiguredHubUrl('');
                    toast.success(t('rst.waiter.profile.hubCleared', { defaultValue: 'Hub сброшен' }));
                    return;
                  }
                  const res = await fetch(`${next}/hub/health`);
                  if (!res.ok) throw new Error('bad_health');
                  const json = await res.json();
                  if (!json?.ok) throw new Error('not_ok');
                  setConfiguredHubUrl(next);
                  setHubUrl(next);
                  toast.success(t('rst.waiter.profile.hubOk', {
                    defaultValue: 'Hub подключён — заказы уйдут на кассу без интернета',
                  }));
                } catch {
                  toast.error(t('rst.waiter.profile.hubFail', {
                    defaultValue: 'Hub недоступен. Проверьте Wi‑Fi и URL с кассы',
                  }));
                } finally {
                  setHubBusy(false);
                }
              }}
            >
              <span className="rst-waiter-profile__item-text">
                {t('rst.waiter.profile.hubSave', { defaultValue: 'Сохранить / проверить Hub' })}
              </span>
            </button>
          </label>
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
