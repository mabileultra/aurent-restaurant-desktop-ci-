import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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

function daysLeft(paidUntil) {
  if (!paidUntil) return null;
  const ms = new Date(paidUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function useTenantBillingPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith('uz') ? 'uz-UZ' : 'ru-RU';
  const qc = useQueryClient();
  const [amount, setAmount] = useState('850000');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [ledgerType, setLedgerType] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerPageSize, setLedgerPageSize] = useState(DEFAULT_PAGE_SIZE);

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

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['tenant-billing-me'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-topups'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-ledger'] });
  };

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
      return tenantBillingApi.createPayment({
        provider,
        amount: value,
      });
    },
    onSuccess: (res) => {
      const url = res?.data?.paymentUrl;
      if (!url) {
        toast.error(t('billing.payUrlMissing'));
        return;
      }
      toast.success(t('billing.redirectingPay'));
      window.location.assign(url);
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.payFailed')),
  });

  const me = meQ.data;
  const remaining = daysLeft(me?.paidUntil);
  const progress = remaining == null ? 0 : Math.min(100, Math.round((remaining / 30) * 100));

  const statusLabel = useMemo(() => {
    if (!me?.billingEnabled) return t('billing.statusNotConfigured');
    if (me.status === 'BLOCKED') return t('billing.statusBlocked');
    if (me.status === 'GRACE') return t('billing.statusGrace');
    return t('billing.statusActive', {
      date: me.paidUntil ? new Date(me.paidUntil).toLocaleDateString(dateLocale) : '—',
    });
  }, [me, t, dateLocale]);

  const setLedgerTypeAndReset = (type) => {
    setLedgerType(type);
    setLedgerPage(0);
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
    loading: meQ.isLoading,
    ledger: ledgerQ.data?.content || [],
    ledgerTotal: ledgerQ.data?.totalElements ?? 0,
    ledgerPage,
    setLedgerPage,
    ledgerPageSize,
    setLedgerPageSize: (size) => {
      setLedgerPageSize(size);
      setLedgerPage(0);
    },
    ledgerLoading: ledgerQ.isLoading,
    pendingTopUps: (topUpsQ.data?.content || []).filter((x) => x.status === 'PENDING'),
    amount,
    setAmount,
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
    submit: () => submitM.mutate(),
    submitting: submitM.isPending,
    pay: (provider) => payM.mutate(provider),
    paying: payM.isPending,
  };
}
