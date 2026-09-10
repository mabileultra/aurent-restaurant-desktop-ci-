import { CalendarDays, CreditCard, FileText, MessageCircle, Package, ShieldCheck, Wallet } from 'lucide-react';
import '../../../styles/billing.css';
import { PageLayout } from '../../../components/ui';
import { useAuthStore } from '../../../store/authStore';
import BillingLedgerConfirmModal from '../components/BillingLedgerConfirmModal';
import BillingLedgerDetailModal from '../components/BillingLedgerDetailModal';
import BillingLedgerSection from '../components/BillingLedgerSection';
import BillingPayModal from '../components/BillingPayModal';
import BillingPaymentsList from '../components/BillingPaymentsList';
import { useTenantBillingPage } from '../hooks/useTenantBillingPage';

function periodStart(paidUntil) {
  if (!paidUntil) return null;
  const end = new Date(paidUntil);
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return start;
}

export default function TenantBillingPage() {
  const p = useTenantBillingPage();
  const me = p.me;
  const user = useAuthStore((s) => s.user);

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(p.dateLocale) : '—');
  const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString(p.dateLocale) : '—');
  const formatDateObj = (d) => (d ? d.toLocaleDateString(p.dateLocale) : '—');

  const start = periodStart(me?.paidUntil || me?.nextChargeAt);
  const end = me?.paidUntil || me?.nextChargeAt;

  const tabTone = (tab) => {
    if (tab === 'TOP_UP') return 'billing-tab--blue';
    if (tab === 'MODULE') return 'billing-tab--violet';
    if (tab === 'CHARGE') return 'billing-tab--amber';
    return '';
  };

  return (
    <PageLayout
      spacing="space-y-4"
      title={p.t('billing.title')}
      subtitle={me?.companyName || p.t('billing.subtitle')}
    >
      <div className="billing-page space-y-4">
        {me?.status === 'BLOCKED' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {p.t('billing.blockedBanner')}
          </div>
        ) : null}

        <section className="billing-hero">
          <div>
            <div className="billing-hero__meta">
              <span className={`billing-chip ${me?.billingEnabled ? 'billing-chip--ok' : ''}`}>
                {me?.billingEnabled ? p.t('billing.connected') : p.t('billing.statusNotConfigured')}
              </span>
              <span className="billing-chip billing-chip--sky">
                ID {me?.companyId || user?.companyId || '—'}
              </span>
              <span className="billing-chip billing-chip--violet">
                {me?.planName
                  || (Number(me?.monthlyTotal) > 0
                    ? `${p.money(me.monthlyTotal)} ${p.t('billing.currency')} ${p.t('billing.perMonth')}`
                    : p.t('billing.noPlan'))}
              </span>
            </div>
            <p className="text-sm text-white/80 mb-1">{p.t('billing.availableBalance')}</p>
            <div className="billing-hero__balance">
              {p.money(me?.balance)} {p.t('billing.currency')}
            </div>
            <p className="billing-hero__hint">
              {p.t('billing.nextChargeHint', {
                date: formatDate(me?.nextChargeAt),
                amount: p.money(me?.monthlyTotal),
              })}
            </p>
          </div>
          <div className="billing-hero__side">
            <div>
              <p className="text-sm text-white/80">{p.t('billing.periodLeft')}</p>
              <p className="text-2xl font-bold mt-1">
                {p.remaining == null ? p.t('billing.periodNotStarted') : p.t('billing.daysLeft', { count: p.remaining })}
              </p>
              <div className="billing-progress mt-3">
                <span style={{ width: `${p.progress}%` }} />
              </div>
              {end ? (
                <div className="billing-hero__period">
                  <span>{formatDateObj(start)}</span>
                  <span>{formatDate(end)}</span>
                </div>
              ) : (
                <p className="billing-hero__period">{p.t('billing.periodHint')}</p>
              )}
            </div>
            <div className="billing-hero__actions">
              <button type="button" className="billing-btn billing-btn--primary" onClick={() => p.openPay()}>
                + {p.t('billing.topUp')}
              </button>
            </div>
          </div>
        </section>

        <section className="billing-metrics">
          <div className="billing-metric billing-metric--plan">
            <div className="billing-metric__icon"><Package size={16} /></div>
            <div className="billing-metric__label">{p.t('billing.metricPlan')}</div>
            <div className="billing-metric__value">
              {me?.planName
                || (Number(me?.monthlyTotal) > 0
                  ? `${p.money(me.monthlyTotal)} ${p.t('billing.perMonth')}`
                  : '—')}
            </div>
            <div className="billing-metric__sub">
              {me?.maxRegisters ? p.t('billing.registersCount', { count: me.maxRegisters }) : '—'}
              {' · '}
              {me?.maxStores ? p.t('billing.storesCount', { count: me.maxStores }) : '—'}
            </div>
          </div>
          <div className="billing-metric billing-metric--date">
            <div className="billing-metric__icon"><CalendarDays size={16} /></div>
            <div className="billing-metric__label">{p.t('billing.metricNext')}</div>
            <div className="billing-metric__value">{formatDate(me?.nextChargeAt)}</div>
            <div className="billing-metric__sub">
              {me?.autoChargeEnabled ? p.t('billing.autoOn') : p.t('billing.autoOff')}
            </div>
          </div>
          <div className="billing-metric billing-metric--monthly">
            <div className="billing-metric__icon"><Wallet size={16} /></div>
            <div className="billing-metric__label">{p.t('billing.metricMonthly')}</div>
            <div className="billing-metric__value">
              {p.money(me?.monthlyTotal)} {p.t('billing.currency')}
            </div>
            <div className="billing-metric__sub">
              {Number(me?.planMonthlyPrice) > 0
                ? p.t('billing.monthlyBreakdown', {
                    plan: p.money(me?.planMonthlyPrice),
                    addon: p.money(me?.addonMonthlyAmount),
                  })
                : p.t('billing.monthlyCustom', { amount: p.money(me?.monthlyTotal) })}
            </div>
          </div>
          <div className="billing-metric billing-metric--status">
            <div className="billing-metric__icon"><CreditCard size={16} /></div>
            <div className="billing-metric__label">{p.t('billing.metricStatus')}</div>
            <div className="billing-metric__value">
              <span className={`billing-badge billing-badge--${me?.status || 'ACTIVE'}`}>
                {p.t(`platform.billing.statuses.${me?.status || 'ACTIVE'}`)}
              </span>
            </div>
            <div className="billing-metric__sub">{p.statusLabel}</div>
          </div>
        </section>

        <section className="billing-grid">
          <BillingLedgerSection
            t={p.t}
            money={p.money}
            formatDateTime={formatDateTime}
            ledgerTabs={p.ledgerTabs}
            ledgerType={p.ledgerType}
            setLedgerType={p.setLedgerType}
            tabTone={tabTone}
            ledger={p.ledger}
            ledgerLoading={p.ledgerLoading}
            ledgerPage={p.ledgerPage}
            ledgerPageSize={p.ledgerPageSize}
            ledgerTotal={p.ledgerTotal}
            setLedgerPage={p.setLedgerPage}
            setLedgerPageSize={p.setLedgerPageSize}
            pageSizeOptions={p.pageSizeOptions}
            selectedIds={p.selectedIds}
            allPageSelected={p.allPageSelected}
            selectAllRef={p.selectAllRef}
            toggleSelect={p.toggleSelect}
            toggleSelectAllPage={p.toggleSelectAllPage}
            openDetail={p.openDetail}
            openDeleteOne={p.openDeleteOne}
            openDeleteSelected={p.openDeleteSelected}
            openDeleteAll={p.openDeleteAll}
            deleting={p.deleting}
          />

          <div id="billing-topup" className="billing-topup">
            <h3 className="billing-topup__title">{p.t('billing.quickTopUp')}</h3>
            <div className="billing-presets">
              {p.presets.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`billing-preset ${String(p.amount) === String(value) ? 'billing-preset--active' : ''}`}
                  onClick={() => p.setAmount(String(value))}
                >
                  {p.money(value)}
                </button>
              ))}
            </div>
            <label className="billing-field-label" htmlFor="billing-amount">
              {p.t('billing.amountLabel')}
            </label>
            <input
              id="billing-amount"
              className="billing-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={p.amount}
              onChange={(e) => p.setAmount(e.target.value)}
              placeholder={p.t('billing.customAmount')}
            />

            <button
              type="button"
              className="billing-btn billing-btn--accent"
              disabled={!p.amountValid}
              onClick={() => p.openPay()}
            >
              {p.t('billing.choosePayMethod')}
            </button>
            <p className="text-xs text-slate-500 mb-3">{p.t('billing.autoPayHint')}</p>

            <div className="billing-manual">
              <button
                type="button"
                className="text-sm font-semibold text-slate-600 underline mb-2"
                onClick={() => p.setShowManual((v) => !v)}
              >
                {p.showManual ? p.t('billing.hideManual') : p.t('billing.showManual')}
              </button>

              {p.showManual ? (
                <>
                  <textarea
                    className="billing-textarea"
                    rows={2}
                    value={p.comment}
                    onChange={(e) => p.setComment(e.target.value)}
                    placeholder={p.t('billing.comment')}
                  />
                  <label className="billing-drop">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => p.setFile(e.target.files?.[0] || null)}
                    />
                    {p.file ? p.file.name : p.t('billing.attachFile')}
                  </label>
                  <button
                    type="button"
                    className="billing-btn billing-btn--accent"
                    disabled={p.submitting || !p.amountValid}
                    onClick={p.submit}
                  >
                    {p.submitting ? p.t('common.saving') : p.t('billing.sendToSuperAdmin')}
                  </button>
                  <p className="mt-2 text-xs text-slate-500">{p.t('billing.topUpHint')}</p>
                </>
              ) : null}
            </div>

            {p.pendingTopUps.length > 0 ? (
              <p className="mt-3 text-sm text-amber-700">
                {p.t('billing.pendingCount', { count: p.pendingTopUps.length })}
              </p>
            ) : null}

            <h3 className="billing-topup__title mt-5">{p.t('billing.paymentsTitle')}</h3>
            <BillingPaymentsList
              t={p.t}
              money={p.money}
              formatDateTime={formatDateTime}
              rows={p.payments}
              loading={p.paymentsLoading}
            />
          </div>
        </section>

        <section className="billing-footer">
          <div className="billing-footer__card billing-footer__card--grace">
            <span className="billing-footer__icon"><ShieldCheck size={18} /></span>
            <div>
              <p className="billing-footer__title">{p.t('billing.footerGraceTitle')}</p>
              <p className="billing-footer__text">{p.t('billing.footerGraceText')}</p>
            </div>
          </div>
          <div className="billing-footer__card billing-footer__card--docs">
            <span className="billing-footer__icon"><FileText size={18} /></span>
            <div>
              <p className="billing-footer__title">{p.t('billing.footerDocsTitle')}</p>
              <p className="billing-footer__text">{p.t('billing.footerDocsText')}</p>
            </div>
          </div>
          <div className="billing-footer__card billing-footer__card--support">
            <span className="billing-footer__icon"><MessageCircle size={18} /></span>
            <div>
              <p className="billing-footer__title">{p.t('billing.footerSupportTitle')}</p>
              <p className="billing-footer__text">{p.t('billing.footerSupportText')}</p>
            </div>
          </div>
        </section>
      </div>

      <BillingPayModal
        open={p.payOpen}
        onClose={p.closePay}
        t={p.t}
        money={p.money}
        amount={p.amount}
        setAmount={p.setAmount}
        amountValid={p.amountValid}
        presets={p.presets}
        method={p.payMethod}
        setMethod={p.setPayMethod}
        card={p.card}
        setCard={p.setCard}
        paying={p.paying}
        onPay={p.pay}
        clickPaymentUrl={p.clickPaymentUrl}
        clickPaid={p.clickPaid}
        onOpenClick={p.openClick}
      />
      <BillingLedgerDetailModal
        open={!!p.detailRow}
        onClose={p.closeDetail}
        row={p.detailRow}
        t={p.t}
        money={p.money}
        formatDateTime={formatDateTime}
        onDelete={p.openDeleteOne}
        deleting={p.deleting}
      />
      <BillingLedgerConfirmModal
        open={!!p.confirm}
        onClose={p.closeConfirm}
        title={p.t('billing.ledgerDeleteTitle')}
        hint={p.confirmHint}
        note={p.t('billing.ledgerDeleteNote')}
        confirmLabel={p.t('common.delete')}
        cancelLabel={p.t('common.cancel')}
        onConfirm={p.confirmDelete}
        isPending={p.deleting}
      />
    </PageLayout>
  );
}
