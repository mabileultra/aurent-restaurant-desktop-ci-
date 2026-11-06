import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { tenantBillingApi } from '../../../api';
import { parseMoneyInput } from '../utils/parseMoneyInput';

const EMPTY_CARD = { pan: '', exp: '', cvv: '', holder: '' };

export function useTenantBillingPaySession({ amount }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethodState] = useState('CLICK');
  const [card, setCard] = useState(EMPTY_CARD);
  const [onlineIntentId, setOnlineIntentId] = useState(null);
  const [onlinePaymentUrl, setOnlinePaymentUrl] = useState('');

  const clearOnlineSession = useCallback(() => {
    setOnlineIntentId(null);
    setOnlinePaymentUrl('');
  }, []);

  const closeAfterPaid = useCallback(() => {
    setPayOpen(false);
    clearOnlineSession();
  }, [clearOnlineSession]);

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
      if (provider === 'CLICK' || provider === 'PAYME') {
        setOnlineIntentId(intentId);
        setOnlinePaymentUrl(url);
        qc.invalidateQueries({ queryKey: ['tenant-billing-payments'] });
        return;
      }
      toast.success(t('billing.redirectingPay'));
      window.location.assign(url);
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.payFailed')),
  });

  return {
    payOpen,
    openPay: (method) => {
      if (method) setPayMethodState(method);
      setPayOpen(true);
    },
    closePay: () => {
      setPayOpen(false);
      clearOnlineSession();
    },
    closeAfterPaid,
    payMethod,
    setPayMethod: (method) => {
      setPayMethodState(method);
      clearOnlineSession();
    },
    card,
    setCard,
    pay: (provider) => payM.mutate(provider),
    paying: payM.isPending,
    paymentUrl: onlinePaymentUrl,
    openPayment: () => {
      if (onlinePaymentUrl) window.open(onlinePaymentUrl, '_blank', 'noopener,noreferrer');
    },
    onlineIntentId,
    clearOnlineSession,
  };
}
