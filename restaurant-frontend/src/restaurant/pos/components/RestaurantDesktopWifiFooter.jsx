import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRestaurantDesktopCloudOnline } from '../hooks/useRestaurantDesktopCloudOnline';
import './restaurant-desktop-wifi-footer.css';

/**
 * Quiet cloud Wi‑Fi mark — only inside hamburger settings footer (not hall chrome).
 */
export default function RestaurantDesktopWifiFooter() {
  const { t } = useTranslation();
  const { online, liveSession, ready, isDesktop } = useRestaurantDesktopCloudOnline();

  if (!isDesktop || !ready) return null;

  // Glow only when uplink + sync session — иначе «сеть есть, а не обновляется».
  const syncing = online && liveSession;
  const label = syncing
    ? t('rst.desktop.cloudOnline', { defaultValue: 'Облако онлайн · синк' })
    : online
      ? t('rst.desktop.cloudNoSession', {
        defaultValue: 'Сеть есть, синк выкл — войдите админом',
      })
      : t('rst.desktop.cloudOffline', { defaultValue: 'Облако офлайн' });

  return (
    <div
      className={`rst-desktop-wifi${syncing ? ' is-online' : ' is-offline'}${online && !liveSession ? ' is-nosession' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      title={label}
    >
      {online ? (
        <Wifi size={22} strokeWidth={2.25} className="rst-desktop-wifi__icon" aria-hidden />
      ) : (
        <WifiOff size={22} strokeWidth={2.25} className="rst-desktop-wifi__icon" aria-hidden />
      )}
    </div>
  );
}
