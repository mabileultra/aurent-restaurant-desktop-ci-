import { AlertTriangle, Download, MessageSquare, X } from 'lucide-react';

function kindIcon(kind) {
  if (kind === 'UPDATE') return Download;
  if (kind === 'ALERT') return AlertTriangle;
  return MessageSquare;
}

export default function CashierNotificationsPanel({ notifications }) {
  const {
    t,
    items,
    loading,
    dismiss,
    runAction,
    resolveTitle,
    resolveBody,
    resolveAction,
  } = notifications;

  return (
    <div className="cashier-notifications__panel" role="dialog" aria-label={t('notifications.panelTitle')}>
      <div className="cashier-notifications__head">
        <p className="cashier-notifications__title">{t('notifications.panelTitle')}</p>
      </div>
      <div className="cashier-notifications__body">
        {loading && items.length === 0 ? (
          <p className="cashier-notifications__empty">{t('notifications.loading')}</p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="cashier-notifications__empty">{t('notifications.empty')}</p>
        ) : null}
        {items.map((item) => {
          const Icon = kindIcon(item.kind);
          const actionLabel = resolveAction(item);
          return (
            <article key={item.id} className={`cashier-notifications__item cashier-notifications__item--${item.kind.toLowerCase()}`}>
              <div className="cashier-notifications__item-icon" aria-hidden>
                <Icon size={18} strokeWidth={2.25} />
              </div>
              <div className="cashier-notifications__item-content">
                <p className="cashier-notifications__item-title">{resolveTitle(item)}</p>
                <p className="cashier-notifications__item-body">{resolveBody(item)}</p>
                {item.updateState === 'progress' ? (
                  <div className="cashier-notifications__progress" aria-hidden>
                    <span style={{ width: `${item.percent || 0}%` }} />
                  </div>
                ) : null}
                <div className="cashier-notifications__item-actions">
                  {actionLabel ? (
                    <button type="button" className="cashier-notifications__action" onClick={() => runAction(item)}>
                      {actionLabel}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="cashier-notifications__dismiss"
                    onClick={() => dismiss(item)}
                    aria-label={t('notifications.dismiss')}
                  >
                    <X size={16} strokeWidth={2.25} aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
