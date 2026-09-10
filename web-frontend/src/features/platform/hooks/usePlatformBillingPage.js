import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformBillingApi } from '../../../api';
import { parseMoneyInput } from '../../billing/utils/parseMoneyInput';
import { shiftIsoDate, toIsoDate } from '../components/BillingPeriodCalendar';

const STATUS_FILTERS = [null, 'ACTIVE', 'GRACE', 'BLOCKED', 'TRIAL'];
const COMPANIES_PAGE_SIZE = 10;

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
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [periodStartOn, setPeriodStartOn] = useState(() => toIsoDate(new Date()));
  const [companiesPage, setCompaniesPage] = useState(0);

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

  const paymentsQ = useQuery({
    queryKey: ['platform-billing-payments'],
    queryFn: () => platformBillingApi.payments({ size: 20, sort: 'createdAt,desc' }).then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['platform-billing-overview'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-companies'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-topups'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-payments'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-plans'] });
  };

  const plans = plansQ.data || [];

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
      const monthly = parseMoneyInput(monthlyAmount, { allowZero: true });
      if (monthly == null) {
        throw new Error(t('platform.billing.invalidAmount'));
      }
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
    },
    onSuccess: () => {
      toast.success(t('platform.billing.monthlySaved'));
      invalidate();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('platform.billing.actionFailed')),
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

  const companies = companiesQ.data || [];
  const companiesTotal = companies.length;
  const pagedCompanies = useMemo(() => {
    const start = companiesPage * COMPANIES_PAGE_SIZE;
    return companies.slice(start, start + COMPANIES_PAGE_SIZE);
  }, [companies, companiesPage]);

  const selected = useMemo(
    () => companies.find((c) => c.companyId === selectedCompanyId) || null,
    [companies, selectedCompanyId],
  );

  const selectCompany = (row) => {
    setSelectedCompanyId(row.companyId);
    setAssignPlanId(row.planId || '');
    setMonthlyAmount(String(Math.round(Number(row.monthlyTotal || 0))));
    setPeriodStartOn(row.periodStartOn || periodStartFromCharge(row.nextChargeAt));
    setAdjustAmount('');
    setAdjustNote('');
  };

  const prepaidCover = useMemo(() => {
    const monthly = parseMoneyInput(monthlyAmount, { allowZero: true });
    const balance = Number(selected?.balance || 0);
    if (monthly == null) return null;
    if (monthly <= 0) return { kind: 'zero' };
    if (balance < monthly) return { kind: 'empty' };
    return {
      kind: 'ok',
      balance: money(balance),
      monthly: money(monthly),
      months: Math.floor(balance / monthly),
    };
  }, [monthlyAmount, selected]);

  const pickPlan = (planId) => {
    setAssignPlanId(planId);
    const plan = plans.find((item) => item.id === planId);
    if (plan) {
      setMonthlyAmount(String(Math.round(Number(plan.monthlyPrice || 0))));
    }
  };

  return {
    t,
    dateLocale,
    money,
    statusFilters: STATUS_FILTERS,
    search,
    setSearch: (v) => {
      setSearch(v);
      setCompaniesPage(0);
    },
    status,
    setStatus: (v) => {
      setStatus(v);
      setCompaniesPage(0);
    },
    overview: overviewQ.data,
    plans,
    companies: pagedCompanies,
    companiesTotal,
    companiesPage,
    setCompaniesPage,
    companiesPageSize: COMPANIES_PAGE_SIZE,
    topUps: topUpsQ.data?.content || [],
    payments: paymentsQ.data?.content || [],
    paymentsLoading: paymentsQ.isLoading,
    loading: overviewQ.isLoading || companiesQ.isLoading,
    selected,
    selectedCompanyId,
    selectCompany,
    adjustAmount,
    setAdjustAmount,
    adjustAmountValid: parseMoneyInput(adjustAmount) != null,
    adjustNote,
    setAdjustNote,
    assignPlanId,
    pickPlan,
    monthlyAmount,
    setMonthlyAmount,
    monthlyAmountValid: parseMoneyInput(monthlyAmount, { allowZero: true }) != null,
    periodStartOn,
    setPeriodStartOn,
    periodStartValid: /^\d{4}-\d{2}-\d{2}$/.test(periodStartOn || ''),
    prepaidCover,
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
