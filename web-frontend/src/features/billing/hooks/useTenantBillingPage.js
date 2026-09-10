import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';
import { tenantBillingApi } from '../../../api';
import { parseMoneyInput } from '../utils/parseMoneyInput';

const PRESETS = [500000, 850000, 1500000, 3000000];
const LEDGER_TABS = [null, 'TOP_UP', 'CHARGE', 'MODULE'];
const DEFAULT_PAGE_SIZE = TABLE_PAGE_SIZE_OPTIONS[1] || 14;

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function daysLeft(paidUntil, nextChargeAt) {
  const end = paidUntil || nextChargeAt;
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

const EMPTY_CARD = { pan: '', exp: '', cvv: '', holder: '' };

export function useTenantBillingPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('uz') ? 'uz-UZ' : 'ru-RU';
  const qc = useQueryClient();
  const [amount, setAmount] = useState('850000');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [ledgerType, setLedgerType] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState('CLICK');
  const [card, setCard] = useState(EMPTY_CARD);
  const [clickIntentId, setClickIntentId] = useState(null);
  const [clickPaymentUrl, setClickPaymentUrl] = useState('');
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerPageSize, setLedgerPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [detailRow, setDetailRow] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const selectAllRef = useRef(null);

  const parsedAmount = parseMoneyInput(amount);

  const meQ = useQuery({
    queryKey: ['tenant-billing-me'],
    queryFn: () => tenantBillingApi.me().then((r) => r.data),
  });

  const ledgerQ = useQuery({
    queryKey: ['tenant-billing-ledger', ledgerType, ledgerPage, ledgerPageSize],
    queryFn: () =>
      tenantBillingApi
        .ledger({
          type: ledgerType || undefined,
          page: ledgerPage,
          size: ledgerPageSize,
          sort: 'createdAt,desc',
        })
        .then((r) => r.data),
  });

  const topUpsQ = useQuery({
    queryKey: ['tenant-billing-topups'],
    queryFn: () => tenantBillingApi.topUps({ size: 10 }).then((r) => r.data),
  });

  const paymentsQ = useQuery({
    queryKey: ['tenant-billing-payments'],
    queryFn: () => tenantBillingApi.payments({ size: 20, sort: 'createdAt,desc' }).then((r) => r.data),
  });

  const clickPayQ = useQuery({
    queryKey: ['tenant-billing-payment', clickIntentId],
    queryFn: () => tenantBillingApi.payment(clickIntentId).then((r) => r.data),
    enabled: Boolean(clickIntentId) && payOpen,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'PAID' || status === 'CANCELLED' || status === 'FAILED') return false;
      return 3000;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['tenant-billing-me'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-topups'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-ledger'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-payments'] });
  };

  const ledger = ledgerQ.data?.content || [];
  const ledgerTotal = ledgerQ.data?.totalElements ?? 0;
  const pageIds = useMemo(() => ledger.map((row) => row.id), [ledger]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  useEffect(() => {
    if (!ledgerQ.isLoading && ledger.length === 0 && ledgerPage > 0) {
      setLedgerPage((page) => Math.max(0, page - 1));
    }
  }, [ledgerQ.isLoading, ledger.length, ledgerPage]);

  const clickPaid = clickPayQ.data?.status === 'PAID';

  useEffect(() => {
    if (!clickPaid) return undefined;
    toast.success(t('billing.payClickPaid'));
    refresh();
    const timer = setTimeout(() => {
      setPayOpen(false);
      setClickIntentId(null);
      setClickPaymentUrl('');
    }, 1200);
    return () => clearTimeout(timer);
  }, [clickPaid]);

  const clearClickSession = () => {
    setClickIntentId(null);
    setClickPaymentUrl('');
  };

  const onLedgerDeleted = () => {
    setConfirm(null);
    setDetailRow(null);
    refresh();
  };

  const deleteOneM = useMutation({
    mutationFn: (id) => tenantBillingApi.deleteLedgerEntry(id),
    onSuccess: (_data, id) => {
      toast.success(t('billing.ledgerDeleted'));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onLedgerDeleted();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.ledgerDeleteFailed')),
  });

  const deleteSelectedM = useMutation({
    mutationFn: (ids) => tenantBillingApi.deleteLedgerEntries(ids),
    onSuccess: () => {
      toast.success(t('billing.ledgerDeleted'));
      setSelectedIds(new Set());
      onLedgerDeleted();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.ledgerDeleteFailed')),
  });

  const deleteAllM = useMutation({
    mutationFn: () => tenantBillingApi.deleteAllLedger(),
    onSuccess: () => {
      toast.success(t('billing.ledgerDeleted'));
      setSelectedIds(new Set());
      setLedgerPage(0);
      onLedgerDeleted();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.ledgerDeleteFailed')),
  });

  const submitM = useMutation({
    mutationFn: () => {
      const value = parseMoneyInput(amount);
      if (value == null) {
        throw new Error(t('billing.invalidAmount'));
      }
      return tenantBillingApi.submitTopUp({
        amount: value,
        comment,
        file,
      });
    },
    onSuccess: () => {
      toast.success(t('billing.topUpSent'));
      setComment('');
      setFile(null);
      refresh();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.topUpFailed')),
  });

  const payM = useMutation({
    mutationFn: (provider) => {
      const value = parseMoneyInput(amount);
      if (value == null) {
        throw new Error(t('billing.invalidAmount'));
      }
      if (provider === 'HUMO' || provider === 'UZCARD') {
        return Promise.resolve({ data: { stub: true, provider } });
      }
      return tenantBillingApi.createPayment({
        provider,
        amount: value,
      });
    },
    onSuccess: (res, provider) => {
      if (provider === 'HUMO' || provider === 'UZCARD') {
        toast.success(t('billing.payIntegrationSoon'));
        return;
      }
      const url = res?.data?.paymentUrl;
      const intentId = res?.data?.intentId;
      if (!url) {
        toast.error(t('billing.payUrlMissing'));
        return;
      }
      if (provider === 'CLICK') {
        setClickIntentId(intentId);
        setClickPaymentUrl(url);
        qc.invalidateQueries({ queryKey: ['tenant-billing-payments'] });
        return;
      }
      toast.success(t('billing.redirectingPay'));
      window.location.assign(url);
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.payFailed')),
  });

  const me = meQ.data;
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
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const openDetail = (row) => {
    setDetailRow(row);
    tenantBillingApi
      .ledgerEntry(row.id)
      .then((r) => {
        setDetailRow((current) => (current?.id === row.id ? r.data : current));
      })
      .catch(() => {});
  };

  const openDeleteOne = (row) => {
    setDetailRow(null);
    setConfirm({ type: 'one', row });
  };

  const openDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDetailRow(null);
    setConfirm({ type: 'selected' });
  };

  const openDeleteAll = () => {
    if (ledgerTotal === 0) return;
    setDetailRow(null);
    setConfirm({ type: 'all' });
  };

  const confirmDelete = () => {
    if (confirm?.type === 'one' && confirm.row) {
      deleteOneM.mutate(confirm.row.id);
      return;
    }
    if (confirm?.type === 'selected') {
      deleteSelectedM.mutate([...selectedIds]);
      return;
    }
    if (confirm?.type === 'all') {
      deleteAllM.mutate();
    }
  };

  const confirmHint = confirm?.type === 'one'
    ? t('billing.ledgerDeleteOneHint')
    : confirm?.type === 'selected'
      ? t('billing.ledgerDeleteSelectedHint', { count: selectedIds.size })
      : t('billing.ledgerDeleteAllHint');

  const deleting = deleteOneM.isPending || deleteSelectedM.isPending || deleteAllM.isPending;

  return {
    t,
    i18n,
    dateLocale,
    money,
    presets: PRESETS,
    ledgerTabs: LEDGER_TABS,
    pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS,
    me,
    loading: meQ.isLoading,
    ledger,
    ledgerTotal,
    ledgerPage,
    setLedgerPage,
    ledgerPageSize,
    setLedgerPageSize: (size) => {
      setLedgerPageSize(size);
      setLedgerPage(0);
    },
    ledgerLoading: ledgerQ.isLoading,
    selectedIds,
    allPageSelected,
    selectAllRef,
    toggleSelect,
    toggleSelectAllPage,
    detailRow,
    closeDetail: () => setDetailRow(null),
    openDetail,
    openDeleteOne,
    openDeleteSelected,
    openDeleteAll,
    confirm,
    closeConfirm: () => setConfirm(null),
    confirmDelete,
    confirmHint,
    deleting,
    pendingTopUps: (topUpsQ.data?.content || []).filter((x) => x.status === 'PENDING'),
    amount,
    setAmount: (value) => {
      setAmount(value);
      clearClickSession();
    },
    amountValid: parsedAmount != null,
    comment,
    setComment,
    file,
    setFile,
    ledgerType,
    setLedgerType: setLedgerTypeAndReset,
    remaining,
    progress,
    statusLabel,
    showManual,
    setShowManual,
    payOpen,
    openPay: (method) => {
      if (method) setPayMethod(method);
      setPayOpen(true);
    },
    closePay: () => {
      setPayOpen(false);
      clearClickSession();
    },
    payMethod,
    setPayMethod: (method) => {
      setPayMethod(method);
      clearClickSession();
    },
    card,
    setCard,
    submit: () => submitM.mutate(),
    submitting: submitM.isPending,
    pay: (provider) => payM.mutate(provider),
    paying: payM.isPending,
    clickPaymentUrl,
    clickPaid,
    openClick: () => {
      if (clickPaymentUrl) window.open(clickPaymentUrl, '_blank', 'noopener,noreferrer');
    },
    payments: paymentsQ.data?.content || [],
    paymentsLoading: paymentsQ.isLoading,
  };
}
