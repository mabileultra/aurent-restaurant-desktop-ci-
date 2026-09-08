import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformBillingApi } from '../../../api';
import { parseMoneyInput } from '../../billing/utils/parseMoneyInput';

const STATUS_FILTERS = [null, 'ACTIVE', 'GRACE', 'BLOCKED', 'TRIAL'];

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

export function usePlatformBillingPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('uz') ? 'uz-UZ' : 'ru-RU';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');
  const [addonAmount, setAddonAmount] = useState('0');

  const overviewQ = useQuery({
    queryKey: ['platform-billing-overview'],
    queryFn: () => platformBillingApi.overview().then((r) => r.data),
  });

  const plansQ = useQuery({
    queryKey: ['platform-billing-plans'],
    queryFn: () => platformBillingApi.plans({ activeOnly: false }).then((r) => r.data),
  });

  const companiesQ = useQuery({
    queryKey: ['platform-billing-companies', status, search],
    queryFn: () =>
      platformBillingApi
        .companies({ status: status || undefined, search: search || undefined })
        .then((r) => r.data),
  });

  const topUpsQ = useQuery({
    queryKey: ['platform-billing-topups'],
    queryFn: () => platformBillingApi.topUps({ status: 'PENDING', size: 30 }).then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['platform-billing-overview'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-companies'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-topups'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-plans'] });
  };

  const approveM = useMutation({
    mutationFn: (id) => platformBillingApi.approveTopUp(id),
    onSuccess: () => {
      toast.success(t('platform.billing.topUpApproved'));
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || t('platform.billing.actionFailed')),
  });

  const rejectM = useMutation({
    mutationFn: (id) => platformBillingApi.rejectTopUp(id),
    onSuccess: () => {
      toast.success(t('platform.billing.topUpRejected'));
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || t('platform.billing.actionFailed')),
  });

  const assignM = useMutation({
    mutationFn: () => {
      const addon = parseMoneyInput(addonAmount, { allowZero: true });
      if (addon == null) {
        throw new Error(t('platform.billing.invalidAmount'));
      }
      return platformBillingApi.assignPlan(selectedCompanyId, {
        planId: assignPlanId,
        addonMonthlyAmount: addon,
        billingEnabled: true,
        autoChargeEnabled: true,
      });
    },
    onSuccess: () => {
      toast.success(t('platform.billing.planAssigned'));
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || t('platform.billing.actionFailed')),
  });

  const topUpM = useMutation({
    mutationFn: () => {
      const value = parseMoneyInput(adjustAmount);
      if (value == null) {
        throw new Error(t('platform.billing.invalidAmount'));
      }
      return platformBillingApi.topUp(selectedCompanyId, {
        amount: value,
        description: adjustNote || undefined,
      });
    },
    onSuccess: () => {
      toast.success(t('platform.billing.balanceUpdated'));
      setAdjustAmount('');
      setAdjustNote('');
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('platform.billing.actionFailed')),
  });

  const chargeM = useMutation({
    mutationFn: () => {
      const value = parseMoneyInput(adjustAmount);
      if (value == null) {
        throw new Error(t('platform.billing.invalidAmount'));
      }
      return platformBillingApi.charge(selectedCompanyId, {
        amount: value,
        description: adjustNote || undefined,
      });
    },
    onSuccess: () => {
      toast.success(t('platform.billing.balanceUpdated'));
      setAdjustAmount('');
      setAdjustNote('');
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('platform.billing.actionFailed')),
  });

  const blockM = useMutation({
    mutationFn: (blocked) =>
      blocked ? platformBillingApi.block(selectedCompanyId) : platformBillingApi.unblock(selectedCompanyId),
    onSuccess: () => {
      toast.success(t('platform.billing.statusUpdated'));
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || t('platform.billing.actionFailed')),
  });

  const selected = useMemo(
    () => (companiesQ.data || []).find((c) => c.companyId === selectedCompanyId) || null,
    [companiesQ.data, selectedCompanyId],
  );

  return {
    t,
    dateLocale,
    money,
    statusFilters: STATUS_FILTERS,
    search,
    setSearch,
    status,
    setStatus,
    overview: overviewQ.data,
    plans: plansQ.data || [],
    companies: companiesQ.data || [],
    topUps: topUpsQ.data?.content || [],
    loading: overviewQ.isLoading || companiesQ.isLoading,
    selected,
    selectedCompanyId,
    setSelectedCompanyId,
    adjustAmount,
    setAdjustAmount,
    adjustAmountValid: parseMoneyInput(adjustAmount) != null,
    adjustNote,
    setAdjustNote,
    assignPlanId,
    setAssignPlanId,
    addonAmount,
    setAddonAmount,
    approve: (id) => approveM.mutate(id),
    reject: (id) => rejectM.mutate(id),
    assignPlan: () => assignM.mutate(),
    credit: () => topUpM.mutate(),
    debit: () => chargeM.mutate(),
    block: () => blockM.mutate(true),
    unblock: () => blockM.mutate(false),
    busy: approveM.isPending || rejectM.isPending || assignM.isPending || topUpM.isPending || chargeM.isPending || blockM.isPending,
  };
}
