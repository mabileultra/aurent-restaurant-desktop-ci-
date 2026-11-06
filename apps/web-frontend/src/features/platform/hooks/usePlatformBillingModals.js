import { useMemo, useState } from 'react';
import { formatMoneyInputDigits, parseMoneyInput } from '../../billing/utils/parseMoneyInput';
import { shiftIsoDate, toIsoDate } from '../components/BillingPeriodCalendar';

function periodStartFromCharge(iso) {
  if (!iso) return toIsoDate(new Date());
  return shiftIsoDate(toIsoDate(iso), -30);
}

export function usePlatformBillingModals({ collections, plans, money }) {
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

  const selectedRow = useMemo(
    () => collections.rows.find((r) => r.billing?.companyId === selectedCompanyId) || selectedCompanyRow || null,
    [collections.rows, selectedCompanyId, selectedCompanyRow],
  );
  const selected = selectedRow?.billing || null;

  const clearAdjust = () => {
    setAdjustAmount('');
    setAdjustNote('');
  };

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

  const pickPlan = (planId) => {
    setAssignPlanId(planId);
    const plan = plans.find((item) => item.id === planId);
    if (plan) setMonthlyAmount(formatMoneyInputDigits(String(Math.round(Number(plan.monthlyPrice || 0)))) || '0');
  };

  const prepaidCover = useMemo(() => {
    const monthly = parseMoneyInput(monthlyAmount, { allowZero: true });
    const balance = Number(selected?.balance || 0);
    if (monthly == null) return null;
    if (monthly <= 0) return { kind: 'zero' };
    if (balance < monthly) return { kind: 'empty' };
    return { kind: 'ok', balance: money(balance), monthly: money(monthly), months: Math.floor(balance / monthly) };
  }, [monthlyAmount, selected, money]);

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

  return {
    selectedCompanyId,
    setSelectedCompanyId,
    selectedCompanyRow,
    setSelectedCompanyRow,
    selectedRow,
    selected,
    selectCompany,
    drawerTab,
    setDrawerTab,
    adjustAmount,
    setAdjustAmount,
    adjustNote,
    setAdjustNote,
    clearAdjust,
    assignPlanId,
    pickPlan,
    monthlyAmount,
    setMonthlyAmount,
    periodStartOn,
    setPeriodStartOn,
    prepaidCover,
    paymentModalOpen,
    paymentTargetCompanyId,
    openPaymentModal,
    closePaymentModal,
  };
}
