import { useSyncExternalStore } from 'react';
import { LogOut, Maximize2, Moon, Sun } from 'lucide-react';
import BrandMark from '../../../../components/shared/BrandMark';
import LanguageSwitcher from '../../../../components/shared/LanguageSwitcher';
import RestaurantMobileInstallCorner from '../../../desktop-download/components/RestaurantMobileInstallCorner';
import { BRAND_LOGO_SIZES, BRAND_NAME } from '../../../../config/brandLogos';
import { useTenantDisplayStore } from '../../../../store/tenantDisplayStore';
import {
  readRestaurantTheme,
  setRestaurantTheme,
  subscribeRestaurantTheme,
} from '../../../../store/themeStore';
import '../../../../restaurant/shared/styles/rst-lang-switch.css';

export default function CashierPinLoginChrome({
  t,
  clockLabel,
  dateLabel,
  onFullscreen,
  onQuit,
  showQuit,
}) {
  const displayAppName = useTenantDisplayStore((s) => s.displayAppName);
  const theme = useSyncExternalStore(subscribeRestaurantTheme, readRestaurantTheme, () => 'dark');
  const light = theme === 'light';

  return (
    <header className="cashier-pin-roster__chrome">
      <div className="cashier-pin-roster__brand">
        <span className="cashier-pin-roster__logo">
          <BrandMark variant="icon" size={BRAND_LOGO_SIZES.iconMd} />
        </span>
        <div className="cashier-pin-roster__brand-text">
          <span className="cashier-pin-roster__brand-name">{displayAppName() || BRAND_NAME}</span>
          <span className="cashier-pin-roster__brand-sub">
            {t('cashierLogin.terminalSubtitle', {
              defaultValue: 'Терминал ресторана',
            })}
          </span>
        </div>
      </div>

      <div className="cashier-pin-roster__chrome-right">
        <div className="cashier-pin-roster__clock" aria-hidden="true">
          <span className="cashier-pin-roster__clock-time">{clockLabel}</span>
          <span className="cashier-pin-roster__clock-date">{dateLabel}</span>
        </div>

        <LanguageSwitcher
          variant="rst"
          className="cashier-pin-roster__lang"
        />

        <RestaurantMobileInstallCorner />

        <button
          type="button"
          className="cashier-pin-roster__icon-btn"
          onClick={() => setRestaurantTheme(light ? 'dark' : 'light')}
          aria-label={t('cashierLogin.theme', { defaultValue: 'Тема' })}
          title={light
            ? t('rst.themeDark', { defaultValue: 'Тёмная' })
            : t('rst.themeLight', { defaultValue: 'Светлая' })}
        >
          {light ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
        </button>

        <button
          type="button"
          className="cashier-pin-roster__icon-btn"
          onClick={onFullscreen}
          aria-label={t('cashierLogin.fullscreen', { defaultValue: 'На весь экран' })}
          title={t('cashierLogin.fullscreen', { defaultValue: 'На весь экран' })}
        >
          <Maximize2 size={20} strokeWidth={2} />
        </button>
        {showQuit ? (
          <button
            type="button"
            className="cashier-pin-roster__icon-btn"
            onClick={onQuit}
            aria-label={t('cashierLogin.quit', { defaultValue: 'Выход' })}
            title={t('cashierLogin.quit', { defaultValue: 'Выход' })}
          >
            <LogOut size={20} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
