import { ArrowRight, CheckCircle2, Copy, MinusCircle, PlusCircle, Send, Wallet, X } from 'lucide-react';
import BillingPaymentsList from '../../../billing/components/BillingPaymentsList';
import BillingCompanyManage from './BillingCompanyManage';
import BillingDeferralBlock from './BillingDeferralBlock';
import { STATE_TONE, activeDeferralDay, balanceTone, dueHint, initials } from './billingCollectionsUi';

const DRAWER_TABS = ['overview', 'payments', 'manage'];
const LEDGER_ICON = { TOP_UP: PlusCircle, BONUS: PlusCircle, CHARGE: MinusCircle, MODULE: MinusCircle };

function InfoCell({ label, children, sub, tone }) {
  return (
    <div className="bc-info">
      <span className="bc-info__label">{label}</span>
      <span className={`bc-info__value${tone ? ` bc-text--${tone}` : ''}`}>{children}</span>
      {sub ? <span className={`bc-sub bc-text--${sub.tone}`}>{sub.text}</span> : null}
    </div>
  );
}

function LedgerTimeline({ p, limit }) {
  const { t, money, formatDate } = p;
  const rows = limit ? p.ledger.slice(0, limit) : p.ledger;
  if (p.ledgerLoading) return <p className="bc-muted">{t('common.loading')}</p>;
  if (!rows.length) return <p className="bc-muted">{t('platform.billing.collections.historyEmpty')}</p>;
  return (
    <ul className="bc-timeline">
      {rows.map((e) => {
        const positive = Number(e.amount) >= 0;
        const Icon = LEDGER_ICON[e.entryType] || CheckCircle2;
        return (
          <li key={e.id} className={`bc-timeline__item bc-timeline__item--${positive ? 'success' : 'danger'}`}>
            <Icon size={18} aria-hidden />
            <span className="bc-timeline__body">
              <span className="bc-timeline__title">{t(`billing.ledgerTypes.${e.entryType}`, { defaultValue: e.entryType })}</span>
              <span className="bc-sub">
                {e.paymentMethod ? `${t(`platform.billing.collections.methods.${e.paymentMethod}`)} · ` : ''}
                {e.description || '—'}
              </span>
            </span>
            <span className="bc-timeline__side">
              <span className={`bc-text--${positive ? 'success' : 'danger'}`}>
                {positive ? '+' : ''}{money(e.amount)} {t('billing.currency')}
              </span>
              <span className="bc-sub">{formatDate(e.createdAt)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function BillingCompanyDrawer({ p }) {
  const { t, money, formatDate, selectedRow: row, selected: b } = p;
  if (!row) return null;
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  const currency = t('billing.currency');
  const tone = STATE_TONE[row.paymentState];

  return (
    <aside className="bc-card bc-drawer" aria-label={b.companyName}>
      <header className="bc-drawer__head">
        <span className={`bc-avatar bc-avatar--lg bc-avatar--${tone}`}>{initials(b.companyName)}</span>
        <div className="min-w-0 flex-1">
          <p className="bc-drawer__name">{b.companyName || `#${b.companyId}`}</p>
          <p className="bc-company__meta">ID: {b.companyId}</p>
        </div>
        <span className={`bc-badge bc-badge--${tone}`}>{k(`states.${row.paymentState}`)}</span>
        <button type="button" className="bc-icon-btn" onClick={p.closeDrawer} aria-label={t('common.close')}>
          <X size={18} />
        </button>
      </header>

      <nav className="bc-drawer__tabs">
        {DRAWER_TABS.map((key) => (
          <button
            key={key}
            type="button"
            className={p.drawerTab === key ? 'bc-drawer__tab bc-drawer__tab--active' : 'bc-drawer__tab'}
            onClick={() => p.setDrawerTab(key)}
          >
            {k(`drawerTabs.${key}`)}
          </button>
        ))}
      </nav>

      <div className="bc-drawer__body">
        {p.drawerTab === 'overview' ? (
          <>
            <div className="bc-info-grid">
              <InfoCell label={k('colPlan')}>
                {b.planName ? <span className="bc-pill bc-pill--plan">{b.planName}</span> : k('customPlan')}
              </InfoCell>
              <InfoCell label={k('colMonthly')}>{money(b.monthlyTotal)} {currency}</InfoCell>
              <InfoCell label={k('currentBalance')} tone={balanceTone(b.balance)}>{money(b.balance)} {currency}</InfoCell>
              <InfoCell label={k('colNext')} sub={dueHint(row, t)}>{formatDate(b.nextChargeAt)}</InfoCell>
              <InfoCell label={k('registeredAt')}>{formatDate(row.companyCreatedAt)}</InfoCell>
              <InfoCell label={k('lastPayment')}>
                {row.lastPaymentMethod ? k(`methods.${row.lastPaymentMethod}`) : '—'}
                {row.lastPaymentAt ? <span className="bc-sub">{formatDate(row.lastPaymentAt)}</span> : null}
              </InfoCell>
              {activeDeferralDay(b) ? (
                <InfoCell
                  label={k('deferral.title')}
                  tone="info"
                  sub={b.deferralReason ? { text: b.deferralReason, tone: 'muted' } : null}
                >
                  {k('deferral.until', { date: formatDate(activeDeferralDay(b)) })}
                </InfoCell>
              ) : null}
              {row.companyPhone ? <InfoCell label={k('phone')}>{row.companyPhone}</InfoCell> : null}
              {row.companyTin ? <InfoCell label={k('tin')}>{row.companyTin}</InfoCell> : null}
            </div>
            <div className="bc-section-head">
              <h4>{k('historyTitle')}</h4>
              <button type="button" className="bc-link" onClick={() => p.setDrawerTab('payments')}>
                {k('seeAll')} <ArrowRight size={14} aria-hidden />
              </button>
            </div>
            <LedgerTimeline p={p} limit={4} />
          </>
        ) : null}

        {p.drawerTab === 'payments' ? (
          <>
            <h4 className="bc-section-title">{k('historyTitle')}</h4>
            <LedgerTimeline p={p} />
            <h4 className="bc-section-title">{k('onlinePayments')}</h4>
            <BillingPaymentsList
              t={t}
              money={money}
              formatDateTime={p.formatDateTime}
              rows={p.companyPayments}
              loading={p.companyPaymentsLoading}
            />
          </>
        ) : null}

        {p.drawerTab === 'manage' ? (
          <>
            <BillingDeferralBlock key={b.companyId} p={p} />
            <BillingCompanyManage p={p} />
          </>
        ) : null}
      </div>

      <footer className="bc-drawer__foot">
        <div className="bc-drawer__remind">
          <button
            type="button"
            className="bc-btn bc-btn--telegram"
            onClick={() => p.actions.remindTelegram(row)}
            disabled={!row.companyPhone}
            title={row.companyPhone ? undefined : k('reminder.noPhone')}
          >
            <Send size={16} aria-hidden />
            {k('reminder.telegram')}
          </button>
          <button
            type="button"
            className="bc-btn bc-btn--outline"
            onClick={() => p.actions.copyReminder(row)}
            aria-label={k('reminder.copy')}
            title={k('reminder.copy')}
          >
            <Copy size={16} aria-hidden />
          </button>
        </div>
        <button type="button" className="bc-btn bc-btn--primary bc-btn--block" onClick={p.openPaymentModal}>
          <Wallet size={16} aria-hidden />
          {k('acceptPayment')}
        </button>
      </footer>
    </aside>
  );
}
