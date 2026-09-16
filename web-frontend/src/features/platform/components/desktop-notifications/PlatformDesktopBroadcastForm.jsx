import { Bell, Send } from 'lucide-react';
import PlatformDesktopKindChips from './PlatformDesktopKindChips';

export default function PlatformDesktopBroadcastForm({
  t,
  title,
  onTitleChange,
  body,
  onBodyChange,
  kind,
  onKindChange,
  expiresInHours,
  onExpiresInHoursChange,
  onSend,
  sendPending,
}) {
  return (
    <section className="platform-desktop-notifications-card">
      <div className="platform-desktop-notifications-card__head">
        <span className="platform-desktop-notifications-card__icon" aria-hidden>
          <Send size={16} />
        </span>
        <h2 className="platform-desktop-notifications-card__title">
          {t('platform.desktopNotifications.broadcastTitle')}
        </h2>
      </div>
      <div className="platform-desktop-notifications-card__body">
        <div className="platform-desktop-notifications-field">
          <label htmlFor="desktop-notif-title">{t('platform.desktopNotifications.fieldTitle')}</label>
          <input
            id="desktop-notif-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('platform.desktopNotifications.titlePlaceholder')}
          />
        </div>
        <div className="platform-desktop-notifications-field">
          <label htmlFor="desktop-notif-body">{t('platform.desktopNotifications.message')}</label>
          <textarea
            id="desktop-notif-body"
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder={t('platform.desktopNotifications.messagePlaceholder')}
          />
        </div>
        <div className="platform-desktop-notifications-meta">
          <PlatformDesktopKindChips t={t} kind={kind} onKindChange={onKindChange} />
          <div className="platform-desktop-notifications-field platform-desktop-notifications-field--hours">
            <label htmlFor="desktop-notif-expires">{t('platform.desktopNotifications.expires')}</label>
            <input
              id="desktop-notif-expires"
              type="number"
              min="1"
              max="720"
              value={expiresInHours}
              onChange={(e) => onExpiresInHoursChange(e.target.value)}
            />
          </div>
        </div>
        <div className="platform-desktop-notifications-actions">
          <button
            type="button"
            className="admin-btn-primary platform-desktop-notifications-btn"
            onClick={onSend}
            disabled={sendPending}
          >
            <Bell size={15} />
            {t('platform.desktopNotifications.send')}
          </button>
        </div>
      </div>
    </section>
  );
}
