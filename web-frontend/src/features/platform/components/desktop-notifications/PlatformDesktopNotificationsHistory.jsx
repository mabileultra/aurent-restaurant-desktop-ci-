import { formatDistanceToNow } from 'date-fns';
import { ru, uz } from 'date-fns/locale';

function resolveLocale(language) {
  if (language?.startsWith('uz')) return uz;
  return ru;
}

export default function PlatformDesktopNotificationsHistory({ t, items, loading, language }) {
  return (
    <section className="platform-desktop-notifications-card">
      <div className="platform-desktop-notifications-card__head">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t('platform.desktopNotifications.historyTitle')}
        </p>
      </div>
      <div className="platform-desktop-notifications-card__body platform-desktop-notifications-history">
        {loading ? <p className="platform-desktop-notifications-empty">{t('common.loading')}</p> : null}
        {!loading && items.length === 0 ? (
          <p className="platform-desktop-notifications-empty">{t('platform.desktopNotifications.historyEmpty')}</p>
        ) : null}
        {items.map((item) => (
          <article key={item.id} className="platform-desktop-notifications-history__item">
            <div className="platform-desktop-notifications-history__meta">
              <span className={`platform-desktop-notifications-history__kind platform-desktop-notifications-history__kind--${item.kind.toLowerCase()}`}>
                {t(`platform.desktopNotifications.kind${item.kind.charAt(0)}${item.kind.slice(1).toLowerCase()}`)}
              </span>
              <time dateTime={item.createdAt}>
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: resolveLocale(language),
                })}
              </time>
            </div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
