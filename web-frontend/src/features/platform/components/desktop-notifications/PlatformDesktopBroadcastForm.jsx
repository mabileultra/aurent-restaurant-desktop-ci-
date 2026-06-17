import { Bell, Send } from 'lucide-react';

const KIND_OPTIONS = [
  { value: 'MESSAGE', labelKey: 'platform.desktopNotifications.kindMessage' },
  { value: 'UPDATE', labelKey: 'platform.desktopNotifications.kindUpdate' },
  { value: 'ALERT', labelKey: 'platform.desktopNotifications.kindAlert' },
];

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
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Send size={16} />
          {t('platform.desktopNotifications.broadcastTitle')}
        </div>
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
        <div className="platform-desktop-notifications-field">
          <label htmlFor="desktop-notif-kind">{t('platform.desktopNotifications.kind')}</label>
          <select id="desktop-notif-kind" value={kind} onChange={(e) => onKindChange(e.target.value)}>
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="platform-desktop-notifications-field">
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
        <button
          type="button"
          className="platform-desktop-notifications-btn"
          onClick={onSend}
          disabled={sendPending}
        >
          <Bell size={15} />
          {t('platform.desktopNotifications.send')}
        </button>
      </div>
    </section>
  );
}
