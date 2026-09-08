import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { tenantBillingApi } from '../../../api';

const PRESETS = [500000, 850000, 1500000, 3000000];
const LEDGER_TABS = [null, 'TOP_UP', 'CHARGE', 'MODULE'];

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
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [amount, setAmount] = useState('850000');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [ledgerType, setLedgerType] = useState(null);
  const [showManual, setShowManual] = useState(false);

  const meQ = useQuery({
    queryKey: ['tenant-billing-me'],
    queryFn: () => tenantBillingApi.me().then((r) => r.data),
  });

  const ledgerQ = useQuery({
    queryKey: ['tenant-billing-ledger', ledgerType],
    queryFn: () =>
      tenantBillingApi
        .ledger({ type: ledgerType || undefined, size: 30, sort: 'createdAt,desc' })
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
    mutationFn: () =>
      tenantBillingApi.submitTopUp({
        amount: Number(amount),
        comment,
        file,
      }),
    onSuccess: () => {
      toast.success(t('billing.topUpSent'));
      setComment('');
      setFile(null);
      refresh();
    },
    onError: (e) => toast.error(e?.response?.data?.message || t('billing.topUpFailed')),
  });

  const payM = useMutation({
    mutationFn: (provider) =>
      tenantBillingApi.createPayment({
        provider,
        amount: Number(amount),
      }),
    onSuccess: (res) => {
      const url = res?.data?.paymentUrl;
      if (!url) {
        toast.error(t('billing.payUrlMissing'));
        return;
      }
      toast.success(t('billing.redirectingPay'));
      window.location.assign(url);
    },
    onError: (e) => toast.error(e?.response?.data?.message || t('billing.payFailed')),
  });

  const me = meQ.data;
  const remaining = daysLeft(me?.paidUntil);
  const progress = remaining == null ? 0 : Math.min(100, Math.round((remaining / 30) * 100));

  const statusLabel = useMemo(() => {
    if (!me?.billingEnabled) return t('billing.statusNotConfigured');
    if (me.status === 'BLOCKED') return t('billing.statusBlocked');
    if (me.status === 'GRACE') return t('billing.statusGrace');
    return t('billing.statusActive', { date: me.paidUntil ? new Date(me.paidUntil).toLocaleDateString('ru-RU') : '—' });
  }, [me, t]);

  return {
    t,
    money,
    presets: PRESETS,
    ledgerTabs: LEDGER_TABS,
    me,
    loading: meQ.isLoading,
    ledger: ledgerQ.data?.content || [],
    pendingTopUps: (topUpsQ.data?.content || []).filter((x) => x.status === 'PENDING'),
    amount,
    setAmount,
    comment,
    setComment,
    file,
    setFile,
    ledgerType,
    setLedgerType,
    remaining,
    progress,
    statusLabel,
    showManual,
    setShowManual,
    submit: () => submitM.mutate(),
    submitting: submitM.isPending,
    payClick: () => payM.mutate('CLICK'),
    payPayme: () => payM.mutate('PAYME'),
    paying: payM.isPending,
  };
}
