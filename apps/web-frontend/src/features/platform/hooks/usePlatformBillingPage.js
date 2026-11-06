import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformBillingApi } from '../../../api';
import { formatMoneyInputDigits, parseMoneyInput } from '../../billing/utils/parseMoneyInput';
import { useBillingCollections } from './useBillingCollections';
import { useBillingCollectionActions } from './useBillingCollectionActions';
import { usePlatformBillingQueries } from './usePlatformBillingQueries';
import { usePlatformBillingModals } from './usePlatformBillingModals';
import { MAX_BILLING_AMOUNT } from './billingCollectionsConstants';

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function sameMoney(a, b) {
  return Number(a || 0) === Number(b || 0);
}

function errorText(e, t) {
  return e?.response?.data?.message || e?.message || t('platform.billing.actionFailed');
}

export function usePlatformBillingPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('uz') ? 'uz-UZ' : 'ru-RU';
  const collections = useBillingCollections();

  const modals = usePlatformBillingModals({
    collections,
    plans: [],
    money,
  });

  const queries = usePlatformBillingQueries({
    selectedCompanyId: modals.selectedCompanyId,
    paymentModalOpen: modals.paymentModalOpen,
  });

  const plans = queries.plans;
  const invalidate = queries.invalidate;

  const mutation = (fn, successKey, after) => ({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(t(successKey));
      after?.();
      invalidate();
    },
    onError: (e) => toast.error(errorText(e, t)),
  });

  const approveM = useMutation(mutation((id) => platformBillingApi.approveTopUp(id), 'platform.billing.topUpApproved'));
  const rejectM = useMutation(mutation((id) => platformBillingApi.rejectTopUp(id), 'platform.billing.topUpRejected'));

  const assignM = useMutation(mutation(() => {
    const monthly = parseMoneyInput(modals.monthlyAmount, { allowZero: true });
    if (monthly == null) throw new Error(t('platform.billing.invalidAmount'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(modals.periodStartOn || '')) {
      throw new Error(t('platform.billing.invalidPeriodStart'));
    }
    const plan = plans.find((item) => item.id === modals.assignPlanId);
    const usePlan = Boolean(plan && sameMoney(monthly, plan.monthlyPrice));
    return platformBillingApi.assignPlan(modals.selectedCompanyId, {
      planId: usePlan ? modals.assignPlanId : null,
      addonMonthlyAmount: usePlan ? 0 : monthly,
      billingEnabled: true,
      autoChargeEnabled: true,
      periodStartOn: modals.periodStartOn,
    });
  }, 'platform.billing.monthlySaved'));

  const adjustOptions = (apiCall) => mutation(() => {
    const value = parseMoneyInput(modals.adjustAmount);
    if (value == null) throw new Error(t('platform.billing.invalidAmount'));
    return apiCall(modals.selectedCompanyId, { amount: value, description: modals.adjustNote || undefined });
  }, 'platform.billing.balanceUpdated', modals.clearAdjust);

  const topUpM = useMutation(adjustOptions(platformBillingApi.topUp));
  const chargeM = useMutation(adjustOptions(platformBillingApi.charge));

  const blockM = useMutation(mutation(
    (blocked) => (blocked ? platformBillingApi.block(modals.selectedCompanyId) : platformBillingApi.unblock(modals.selectedCompanyId)),
    'platform.billing.statusUpdated',
  ));

  const manualPaymentM = useMutation(mutation(
    ({ companyId, amount, method, transactionId, comment }) => {
      // Avoid duplicate method prepending since UI already renders the method badge
      const description = [
        transactionId?.trim() ? `TXN ${transactionId.trim()}` : null,
        comment?.trim(),
      ].filter(Boolean).join(' · ');
      return platformBillingApi.topUp(companyId, { amount, description, method });
    },
    'platform.billing.collections.paymentAdded',
    () => modals.closePaymentModal(),
  ));

  const grantDeferralM = useMutation(mutation(
    ({ until, reason }) => platformBillingApi.grantDeferral(modals.selectedCompanyId, { until, reason: reason || undefined }),
    'platform.billing.collections.deferral.granted',
  ));
  const cancelDeferralM = useMutation(mutation(
    () => platformBillingApi.cancelDeferral(modals.selectedCompanyId),
    'platform.billing.collections.deferral.cancelled',
  ));

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(dateLocale) : '—');
  const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString(dateLocale) : '—');

  const actions = useBillingCollectionActions({ t, i18n, money, formatDate, collections, invalidate });

  return {
    t,
    dateLocale,
    money,
    formatDate,
    formatDateTime,
    collections,
    plans,
    topUps: queries.topUps,
    companyDetail: queries.companyDetail,
    selectedRow: modals.selectedRow,
    selected: modals.selected,
    selectedCompanyId: modals.selectedCompanyId,
    selectCompany: modals.selectCompany,
    closeDrawer: () => {
      modals.setSelectedCompanyId(null);
      modals.setSelectedCompanyRow(null);
    },
    openCompanyById: (companyId, company = null) => {
      modals.setSelectedCompanyId(companyId);
      if (company) {
        modals.setSelectedCompanyRow({
          ...company,
          billing: company.billing || company,
        });
      }
      modals.setDrawerTab('overview');
    },
    drawerTab: modals.drawerTab,
    setDrawerTab: modals.setDrawerTab,
    ledger: queries.ledger,
    ledgerLoading: queries.ledgerLoading,
    companyPayments: queries.companyPayments,
    companyPaymentsLoading: queries.companyPaymentsLoading,
    adjustAmount: modals.adjustAmount,
    setAdjustAmount: (val) => modals.setAdjustAmount(formatMoneyInputDigits(val)),
    adjustAmountValid: Boolean(
      parseMoneyInput(modals.adjustAmount) != null &&
      parseMoneyInput(modals.adjustAmount) > 0 &&
      parseMoneyInput(modals.adjustAmount) <= MAX_BILLING_AMOUNT
    ),
    adjustNote: modals.adjustNote,
    setAdjustNote: modals.setAdjustNote,
    assignPlanId: modals.assignPlanId,
    pickPlan: (planId) => {
      modals.setAssignPlanId(planId);
      const plan = plans.find((item) => item.id === planId);
      if (plan) modals.setMonthlyAmount(formatMoneyInputDigits(String(Math.round(Number(plan.monthlyPrice || 0)))) || '0');
    },
    monthlyAmount: modals.monthlyAmount,
    setMonthlyAmount: (val) => modals.setMonthlyAmount(formatMoneyInputDigits(val)),
    monthlyAmountValid: Boolean(
      parseMoneyInput(modals.monthlyAmount, { allowZero: true }) != null &&
      (parseMoneyInput(modals.monthlyAmount, { allowZero: true }) || 0) <= MAX_BILLING_AMOUNT
    ),
    periodStartOn: modals.periodStartOn,
    setPeriodStartOn: modals.setPeriodStartOn,
    periodStartValid: /^\d{4}-\d{2}-\d{2}$/.test(modals.periodStartOn || ''),
    prepaidCover: modals.prepaidCover,
    paymentModalOpen: modals.paymentModalOpen,
    paymentTargetCompanyId: modals.paymentTargetCompanyId,
    allCompanies: queries.allCompanies,
    openPaymentModal: modals.openPaymentModal,
    closePaymentModal: modals.closePaymentModal,
    submitManualPayment: (payload) => manualPaymentM.mutate(payload),
    manualPaymentBusy: manualPaymentM.isPending,
    actions,
    grantDeferral: (payload) => grantDeferralM.mutate(payload),
    cancelDeferral: () => cancelDeferralM.mutate(),
    deferralBusy: grantDeferralM.isPending || cancelDeferralM.isPending,
    approve: (id) => approveM.mutate(id),
    reject: (id) => rejectM.mutate(id),
    assignPlan: () => assignM.mutate(),
    credit: () => topUpM.mutateAsync(),
    debit: () => chargeM.mutateAsync(),
    block: () => blockM.mutateAsync(true),
    unblock: () => blockM.mutateAsync(false),
    busy: approveM.isPending || rejectM.isPending || assignM.isPending
      || topUpM.isPending || chargeM.isPending || blockM.isPending,
  };
}
