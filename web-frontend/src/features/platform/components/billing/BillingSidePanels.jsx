import { Clock, Inbox, Send } from 'lucide-react';
import { dueHint, initials } from './billingCollectionsUi';

export function BillingUpcomingPanel({ p }) {
  const { t, money, collections: c } = p;
  const k = (key) => t(`platform.billing.collections.${key}`);
  return (
    <section className="bc-card bc-side">
      <h3 className="bc-side__title"><Clock size={16} aria-hidden />{k('upcomingTitle')}</h3>
      {c.upcomingLoading ? <p className="bc-muted">{t('common.loading')}</p> : null}
      {!c.upcomingLoading && !c.upcoming.length ? <p className="bc-muted">{k('upcomingEmpty')}</p> : null}
      <ul className="bc-side__list">
        {c.upcoming.slice(0, 8).map((row) => {
          const b = row.billing;
          const hint = dueHint(row, t);
          return (
            <li key={b.companyId}>
              <button type="button" className="bc-side__item" onClick={() => p.selectCompany(row)}>
                <span className="bc-avatar bc-avatar--warning">{initials(b.companyName)}</span>
                <span className="min-w-0 flex-1">
                  <span className="bc-company__name">{b.companyName || `#${b.companyId}`}</span>
                  <span className="bc-sub">{money(b.monthlyTotal)} {t('billing.currency')}</span>
                </span>
                {hint ? <span className={`bc-sub bc-text--${hint.tone}`}>{hint.text}</span> : null}
              </button>
              {row.companyPhone ? (
                <button
                  type="button"
                  className="bc-icon-btn bc-icon-btn--telegram"
                  onClick={() => p.actions.remindTelegram(row)}
                  aria-label={k('reminder.telegram')}
                  title={k('reminder.telegram')}
                >
                  <Send size={15} aria-hidden />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function BillingTopUpQueuePanel({ p }) {
  const { t, money } = p;
  return (
    <section className="bc-card bc-side">
      <h3 className="bc-side__title">
        <Inbox size={16} aria-hidden />
        {t('platform.billing.queueTitle')}
        {p.topUps.length ? <span className="bc-badge bc-badge--warning">{p.topUps.length}</span> : null}
      </h3>
      {p.topUps.length === 0 ? <p className="bc-muted">{t('platform.billing.queueEmpty')}</p> : null}
      <div className="bc-side__list">
        {p.topUps.map((item) => (
          <div key={item.id} className="bc-queue">
            <p className="bc-company__name">{item.companyName || `#${item.companyId}`}</p>
            <p className="bc-text--success font-bold">+{money(item.amount)} {t('billing.currency')}</p>
            <p className="bc-sub">
              {item.receiptFileName || t('platform.billing.noFile')}
              {item.comment ? ` · ${item.comment}` : ''}
            </p>
            <div className="bc-queue__actions">
              <button type="button" className="bc-btn bc-btn--primary" disabled={p.busy} onClick={() => p.approve(item.id)}>
                {t('platform.billing.approve')}
              </button>
              <button type="button" className="bc-btn bc-btn--danger-outline" disabled={p.busy} onClick={() => p.reject(item.id)}>
                {t('platform.billing.reject')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
