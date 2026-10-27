import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformBillingApi } from '../../../api';
import { formatMoneyInputDigits, parseMoneyInput } from '../../billing/utils/parseMoneyInput';
import { shiftIsoDate, toIsoDate } from '../components/BillingPeriodCalendar';
import { COLLECTIONS_QUERY_KEY, useBillingCollections } from './useBillingCollections';
import { useBillingCollectionActions } from './useBillingCollectionActions';

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function sameMoney(a, b) {
  return Number(a || 0) === Number(b || 0);
}

function periodStartFromCharge(iso) {
  if (!iso) return toIsoDate(new Date());
  return shiftIsoDate(toIsoDate(iso), -30);
}

function errorText(e, t) {
  return e?.response?.data?.message || e?.message || t('platform.billing.actionFailed');
}

export function usePlatformBillingPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('uz') ? 'uz-UZ' : 'ru-RU';
  const qc = useQueryClient();
  const collections = useBillingCollections();

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCompanyRow, setSelectedCompanyRow] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [periodStartOn, setPeriodStartOn] = useState(() => toIsoDate(new Date()));
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetCompanyId, setPaymentTargetCompanyId] = useState(null);
  const [returnToDrawerOnClose, setReturnToDrawerOnClose] = useState(false);

  const plansQ = useQuery({
    queryKey: ['platform-billing-plans'],
    queryFn: () => platformBillingApi.plans({ activeOnly: false }).then((r) => r.data),
  });

  const topUpsQ = useQuery({
    queryKey: ['platform-billing-topups'],
    queryFn: () => platformBillingApi.topUps({ status: 'PENDING', size: 30 }).then((r) => r.data),
    enabled: false,
  });

  const ledgerQ = useQuery({
    queryKey: ['platform-billing-ledger', selectedCompanyId],
    queryFn: () => platformBillingApi
      .ledger(selectedCompanyId, { size: 20, sort: 'createdAt,desc' })
      .then((r) => r.data),
    enabled: selectedCompanyId != null,
  });

  const companyPaymentsQ = useQuery({
    queryKey: ['platform-billing-payments', selectedCompanyId],
    queryFn: () => platformBillingApi
      .payments({ companyId: selectedCompanyId, size: 20, sort: 'createdAt,desc' })
      .then((r) => r.data),
    enabled: selectedCompanyId != null,
  });

  const allCompaniesQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', 'all'],
    queryFn: () => platformBillingApi.collectionsCompanies({}).then((r) => r.data),
    enabled: paymentModalOpen,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
    qc.invalidateQueries({ queryKey: ['platform-billing-topups'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-payments'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-ledger'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-plans'] });
  };

  const plans = plansQ.data || [];

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
    const monthly = parseMoneyInput(monthlyAmount, { allowZero: true });
    if (monthly == null) throw new Error(t('platform.billing.invalidAmount'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStartOn || '')) {
      throw new Error(t('platform.billing.invalidPeriodStart'));
    }
    const plan = plans.find((item) => item.id === assignPlanId);
    const usePlan = Boolean(plan && sameMoney(monthly, plan.monthlyPrice));
    return platformBillingApi.assignPlan(selectedCompanyId, {
      planId: usePlan ? assignPlanId : null,
      addonMonthlyAmount: usePlan ? 0 : monthly,
      billingEnabled: true,
      autoChargeEnabled: true,
      periodStartOn,
    });
  }, 'platform.billing.monthlySaved'));

  const clearAdjust = () => {
    setAdjustAmount('');
    setAdjustNote('');
  };

  const adjustOptions = (apiCall) => mutation(() => {
    const value = parseMoneyInput(adjustAmount);
    if (value == null) throw new Error(t('platform.billing.invalidAmount'));
    return apiCall(selectedCompanyId, { amount: value, description: adjustNote || undefined });
  }, 'platform.billing.balanceUpdated', clearAdjust);

  const topUpM = useMutation(adjustOptions(platformBillingApi.topUp));
  const chargeM = useMutation(adjustOptions(platformBillingApi.charge));

  const blockM = useMutation(mutation(
    (blocked) => (blocked ? platformBillingApi.block(selectedCompanyId) : platformBillingApi.unblock(selectedCompanyId)),
    'platform.billing.statusUpdated',
  ));

  const openPaymentModal = (companyId, opts = {}) => {
    const rawId =
      typeof companyId === 'number' || (typeof companyId === 'string' && companyId !== '')
        ? companyId
        : typeof companyId === 'object' && companyId !== null && 'companyId' in companyId
        ? companyId.companyId
        : null;
    const targetId = rawId != null ? rawId : selectedCompanyId;
    setPaymentTargetCompanyId(targetId || null);

    const fromDrawer =
      opts.returnToDrawer ??
      Boolean(selectedCompanyId && (rawId == null || String(rawId) === String(selectedCompanyId)));
    setReturnToDrawerOnClose(fromDrawer);

    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setPaymentTargetCompanyId(null);
    if (!returnToDrawerOnClose) {
      setSelectedCompanyId(null);
      setSelectedCompanyRow(null);
    }
    setReturnToDrawerOnClose(false);
  };

  const manualPaymentM = useMutation(mutation(
    ({ companyId, amount, method, transactionId, comment }) => {
      const description = [
        t(`platform.billing.collections.methods.${method}`),
        transactionId?.trim() ? `TXN ${transactionId.trim()}` : null,
        comment?.trim(),
      ].filter(Boolean).join(' · ');
      return platformBillingApi.topUp(companyId, { amount, description, method });
    },
    'platform.billing.collections.paymentAdded',
    () => closePaymentModal(),
  ));

  const grantDeferralM = useMutation(mutation(
    ({ until, reason }) => platformBillingApi.grantDeferral(selectedCompanyId, { until, reason: reason || undefined }),
    'platform.billing.collections.deferral.granted',
  ));
  const cancelDeferralM = useMutation(mutation(
    () => platformBillingApi.cancelDeferral(selectedCompanyId),
    'platform.billing.collections.deferral.cancelled',
  ));

  const selectedRow = useMemo(
    () => collections.rows.find((r) => r.billing.companyId === selectedCompanyId) || selectedCompanyRow || null,
    [collections.rows, selectedCompanyId, selectedCompanyRow],
  );
  const selected = selectedRow?.billing || null;

  const selectCompany = (row) => {
    const b = row?.billing || {};
    setSelectedCompanyId(b.companyId || null);
    setSelectedCompanyRow(row || null);
    setDrawerTab('overview');
    setAssignPlanId(b.planId || '');
    setMonthlyAmount(formatMoneyInputDigits(String(Math.round(Number(b.monthlyTotal || 0)))) || '0');
    setPeriodStartOn(b.periodStartOn || periodStartFromCharge(b.nextChargeAt));
    clearAdjust();
  };

  const prepaidCover = useMemo(() => {
    const monthly = parseMoneyInput(monthlyAmount, { allowZero: true });
    const balance = Number(selected?.balance || 0);
    if (monthly == null) return null;
    if (monthly <= 0) return { kind: 'zero' };
    if (balance < monthly) return { kind: 'empty' };
    return { kind: 'ok', balance: money(balance), monthly: money(monthly), months: Math.floor(balance / monthly) };
  }, [monthlyAmount, selected]);

  const pickPlan = (planId) => {
    setAssignPlanId(planId);
    const plan = plans.find((item) => item.id === planId);
    if (plan) setMonthlyAmount(formatMoneyInputDigits(String(Math.round(Number(plan.monthlyPrice || 0)))) || '0');
  };

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
    topUps: topUpsQ.data?.content || [],
    selectedRow,
    selected,
    selectedCompanyId,
    selectCompany,
    closeDrawer: () => {
      setSelectedCompanyId(null);
      setSelectedCompanyRow(null);
      setReturnToDrawerOnClose(false);
      setPaymentTargetCompanyId(null);
    },
    openCompanyById: (companyId) => {
      collections.resetFilters();
      collections.setTab('ALL');
      setSelectedCompanyId(companyId);
      setDrawerTab('overview');
    },
    drawerTab,
    setDrawerTab,
    ledger: ledgerQ.data?.content || [],
    ledgerLoading: ledgerQ.isLoading,
    companyPayments: companyPaymentsQ.data?.content || [],
    companyPaymentsLoading: companyPaymentsQ.isLoading,
    adjustAmount,
    setAdjustAmount: (val) => setAdjustAmount(formatMoneyInputDigits(val)),
    adjustAmountValid: parseMoneyInput(adjustAmount) != null,
    adjustNote,
    setAdjustNote,
    assignPlanId,
    pickPlan,
    monthlyAmount,
    setMonthlyAmount: (val) => setMonthlyAmount(formatMoneyInputDigits(val)),
    monthlyAmountValid: parseMoneyInput(monthlyAmount, { allowZero: true }) != null,
    periodStartOn,
    setPeriodStartOn,
    periodStartValid: /^\d{4}-\d{2}-\d{2}$/.test(periodStartOn || ''),
    prepaidCover,
    paymentModalOpen,
    paymentTargetCompanyId,
    allCompanies: allCompaniesQ.data || [],
    openPaymentModal,
    closePaymentModal,
    submitManualPayment: (payload) => manualPaymentM.mutate(payload),
    manualPaymentBusy: manualPaymentM.isPending,
    actions,
    grantDeferral: (payload) => grantDeferralM.mutate(payload),
    cancelDeferral: () => cancelDeferralM.mutate(),
    deferralBusy: grantDeferralM.isPending || cancelDeferralM.isPending,
    approve: (id) => approveM.mutate(id),
    reject: (id) => rejectM.mutate(id),
    assignPlan: () => assignM.mutate(),
    credit: () => topUpM.mutate(),
    debit: () => chargeM.mutate(),
    block: () => blockM.mutate(true),
    unblock: () => blockM.mutate(false),
    busy: approveM.isPending || rejectM.isPending || assignM.isPending
      || topUpM.isPending || chargeM.isPending || blockM.isPending,
  };
}
