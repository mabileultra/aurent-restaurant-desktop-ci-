import React from 'react';
import '../../../styles/billing.css';
import { PageLayout } from '../../../components/ui';
import { useAuthStore } from '../../../store/authStore';
import BillingLedgerConfirmModal from '../components/BillingLedgerConfirmModal';
import BillingLedgerDetailModal from '../components/BillingLedgerDetailModal';
import BillingLedgerSection from '../components/BillingLedgerSection';
import BillingPayModal from '../components/BillingPayModal';
import TenantBillingFooter from '../components/TenantBillingFooter';
import TenantBillingHero from '../components/TenantBillingHero';
import TenantBillingMetrics from '../components/TenantBillingMetrics';
import TenantBillingQuickTopUp from '../components/TenantBillingQuickTopUp';
import { useTenantBillingPage } from '../hooks/useTenantBillingPage';
import { getTabTone, periodStart } from '../utils/billingDateHelpers';

export default function TenantBillingPage() {
  const p = useTenantBillingPage();
  const me = p.me;
  const user = useAuthStore((s) => s.user);

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(p.dateLocale) : '—');
  const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString(p.dateLocale) : '—');
  const formatDateObj = (d) => (d ? d.toLocaleDateString(p.dateLocale) : '—');

  const start = periodStart(me?.paidUntil || me?.nextChargeAt);
  const end = me?.paidUntil || me?.nextChargeAt;

  const planLabel = me?.planName
    || (Number(me?.monthlyTotal) > 0
      ? `${p.money(me.monthlyTotal)} ${p.t('billing.currency')} ${p.t('billing.perMonth')}`
      : p.t('billing.noPlan'));

  return (
    <PageLayout
      className="billing-page"
      spacing="space-y-4"
      title={p.t('billing.title')}
      subtitle={me?.companyName || p.t('billing.subtitle')}
    >
      <div className="space-y-4">
        {me?.status === 'BLOCKED' ? (
          <div className="billing-alert billing-alert--blocked">
            {p.t('billing.blockedBanner')}
          </div>
        ) : null}
        {me?.deferredUntil && new Date(me.deferredUntil) > new Date() ? (
          <div className="billing-alert billing-alert--deferral">
            {p.t('billing.deferralBanner', { date: formatDate(new Date(new Date(me.deferredUntil).getTime() - 1)) })}
          </div>
        ) : null}

        <TenantBillingHero
          me={me}
          user={user}
          planLabel={planLabel}
          p={p}
          start={start}
          end={end}
          formatDate={formatDate}
          formatDateObj={formatDateObj}
        />

        <TenantBillingMetrics me={me} p={p} formatDate={formatDate} />

        <section className="billing-grid">
          <BillingLedgerSection
            t={p.t}
            money={p.money}
            formatDateTime={formatDateTime}
            ledgerTabs={p.ledgerTabs}
            ledgerType={p.ledgerType}
            setLedgerType={p.setLedgerType}
            tabTone={getTabTone}
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

          <TenantBillingQuickTopUp p={p} formatDateTime={formatDateTime} />
        </section>

        <TenantBillingFooter t={p.t} />
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
        paying={p.paying}
        onPay={p.pay}
        paymentUrl={p.paymentUrl}
        paymentPaid={p.paymentPaid}
        onOpenPayment={p.openPayment}
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
