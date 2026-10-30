import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { daysLeft, money } from '../utils/tenantBillingFormat';
import { useTenantBillingLedgerActions } from './useTenantBillingLedgerActions';
import { useTenantBillingPaySession } from './useTenantBillingPaySession';
import { useTenantBillingQueries } from './useTenantBillingQueries';
import { useTenantBillingTopUpForm } from './useTenantBillingTopUpForm';

const PRESETS = [500000, 850000, 1500000, 3000000];
const LEDGER_TABS = [null, 'TOP_UP', 'CHARGE', 'MODULE'];
const DEFAULT_PAGE_SIZE = TABLE_PAGE_SIZE_OPTIONS[1] || 14;

export function useTenantBillingPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('uz') ? 'uz-UZ' : 'ru-RU';
  const paidHandledRef = useRef(false);

  const [ledgerType, setLedgerType] = useState(null);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerPageSize, setLedgerPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  const topUp = useTenantBillingTopUpForm();
  const pay = useTenantBillingPaySession({ amount: topUp.amount });

  const queries = useTenantBillingQueries({
    ledgerType,
    ledgerPage,
    ledgerPageSize,
    onlineIntentId: pay.onlineIntentId,
    payOpen: pay.payOpen,
  });

  const onlinePaid = queries.onlinePayQ.data?.status === 'PAID';

  useEffect(() => {
    if (!onlinePaid) {
      paidHandledRef.current = false;
      return undefined;
    }
    if (paidHandledRef.current) return undefined;
    paidHandledRef.current = true;
    toast.success(t('billing.payClickPaid'));
    queries.refresh();
    const timer = setTimeout(() => pay.closeAfterPaid(), 1200);
    return () => clearTimeout(timer);
  }, [onlinePaid, t, queries.refresh, pay.closeAfterPaid]);

  const ledger = queries.ledgerQ.data?.content || [];
  const ledgerTotal = queries.ledgerQ.data?.totalElements ?? 0;

  const ledgerActions = useTenantBillingLedgerActions({
    ledger,
    ledgerTotal,
    ledgerPage,
    setLedgerPage,
    ledgerLoading: queries.ledgerQ.isLoading,
    refresh: queries.refresh,
  });

  const me = queries.meQ.data;
  const remaining = daysLeft(me?.paidUntil, me?.nextChargeAt);
  const progress = remaining == null ? 0 : Math.min(100, Math.round((remaining / 30) * 100));

  const statusLabel = useMemo(() => {
    if (!me?.billingEnabled) return t('billing.statusNotConfigured');
    if (me.status === 'BLOCKED') return t('billing.statusBlocked');
    if (me.status === 'GRACE') return t('billing.statusGrace');
    return t('billing.statusActive', {
      date: (me.paidUntil || me.nextChargeAt)
        ? new Date(me.paidUntil || me.nextChargeAt).toLocaleDateString(dateLocale)
        : '—',
    });
  }, [me, t, dateLocale]);

  const setLedgerTypeAndReset = (type) => {
    setLedgerType(type);
    setLedgerPage(0);
    ledgerActions.setSelectedIds(new Set());
  };

  return {
    t,
    i18n,
    dateLocale,
    money,
    presets: PRESETS,
    ledgerTabs: LEDGER_TABS,
    pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
    me,
    loading: queries.meQ.isLoading,
    ledger,
    ledgerTotal,
    ledgerPage,
    setLedgerPage,
    ledgerPageSize,
    setLedgerPageSize: (size) => {
      setLedgerPageSizeState(size);
      setLedgerPage(0);
    },
    ledgerLoading: queries.ledgerQ.isLoading,
    selectedIds: ledgerActions.selectedIds,
    allPageSelected: ledgerActions.allPageSelected,
    selectAllRef: ledgerActions.selectAllRef,
    toggleSelect: ledgerActions.toggleSelect,
    toggleSelectAllPage: ledgerActions.toggleSelectAllPage,
    detailRow: ledgerActions.detailRow,
    closeDetail: ledgerActions.closeDetail,
    openDetail: ledgerActions.openDetail,
    openDeleteOne: ledgerActions.openDeleteOne,
    openDeleteSelected: ledgerActions.openDeleteSelected,
    openDeleteAll: ledgerActions.openDeleteAll,
    confirm: ledgerActions.confirm,
    closeConfirm: ledgerActions.closeConfirm,
    confirmDelete: ledgerActions.confirmDelete,
    confirmHint: ledgerActions.confirmHint,
    deleting: ledgerActions.deleting,
    pendingTopUps: (queries.topUpsQ.data?.content || []).filter((x) => x.status === 'PENDING'),
    amount: topUp.amount,
    setAmount: (value) => {
      topUp.setAmount(value);
      pay.clearOnlineSession();
    },
    amountValid: topUp.amountValid,
    comment: topUp.comment,
    setComment: topUp.setComment,
    file: topUp.file,
    setFile: topUp.setFile,
    ledgerType,
    setLedgerType: setLedgerTypeAndReset,
    remaining,
    progress,
    statusLabel,
    showManual: topUp.showManual,
    setShowManual: topUp.setShowManual,
    payOpen: pay.payOpen,
    openPay: pay.openPay,
    closePay: pay.closePay,
    payMethod: pay.payMethod,
    setPayMethod: pay.setPayMethod,
    card: pay.card,
    setCard: pay.setCard,
    submit: topUp.submit,
    submitting: topUp.submitting,
    pay: pay.pay,
    paying: pay.paying,
    paymentUrl: pay.paymentUrl,
    paymentPaid: onlinePaid,
    openPayment: pay.openPayment,
    payments: queries.paymentsQ.data?.content || [],
    paymentsLoading: queries.paymentsQ.isLoading,
  };
}
