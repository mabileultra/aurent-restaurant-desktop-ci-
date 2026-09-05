import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { round2 } from '../../../../utils/taxAmounts';
import {
  isPosReceiptPrintEnabled,
  setPosReceiptPrintEnabled,
} from '../../../../utils/receiptPrintPreference';
import { parseTenderedInput } from '../../../cashier/components/payment/posPaymentConstants';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../../cashier/constants/paymentCardProviders';

export const PHARMACY_PAY_METHODS = ['cash', 'card', 'mixed', 'insurance'];

export const PHARMACY_QUICK_CASH = [
  { amount: 10000, mode: 'add', label: '+10k' },
  { amount: 20000, mode: 'add', label: '+20k' },
  { amount: 50000, mode: 'add', label: '+50k' },
  { amount: 100000, mode: 'add', label: '+100k' },
  { amount: 200000, mode: 'add', label: '+200k' },
];

/**
 * Состояние аптечной панели оплаты (отдельно от retail pay rail).
 */
export function usePharmacyPayRail({
  total,
  checkoutDisabled,
  isPending,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [method, setMethod] = useState('cash');
  const [cashInput, setCashInput] = useState('');
  const [cardInput, setCardInput] = useState('');
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [pinfl, setPinfl] = useState('');
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [printReceiptEnabled, setPrintReceiptEnabled] = useState(isPosReceiptPrintEnabled);

  const toPay = round2(total);
  const defaultCardType = ENABLED_PAYMENT_CARD_PROVIDERS[0]?.cardType ?? null;

  useEffect(() => {
    if (toPay <= 0) {
      setCashInput('');
      setCardInput('');
      setSelectedCardType(null);
    }
  }, [toPay]);

  useEffect(() => {
    if (method !== 'card' && method !== 'mixed') {
      setSelectedCardType(null);
    }
  }, [method]);

  useEffect(() => {
    if (method === 'mixed' && toPay > 0) {
      const cash = parseTenderedInput(cashInput);
      if (cash > 0 && cash < toPay) {
        setCardInput(String(round2(toPay - cash)));
      } else if (cash <= 0) {
        setCardInput('');
      } else if (cash >= toPay) {
        setCardInput('0');
      }
    }
  }, [cashInput, method, toPay]);

  const cashNum = parseTenderedInput(cashInput);
  const cardNum = parseTenderedInput(cardInput);
  const cardType = selectedCardType || defaultCardType;

  const changeDue = useMemo(() => {
    if (method === 'cash') {
      return round2(Math.max(0, cashNum - toPay));
    }
    if (method === 'mixed') {
      const paid = round2(cashNum + cardNum);
      return round2(Math.max(0, paid - toPay));
    }
    return 0;
  }, [cardNum, cashNum, method, toPay]);

  const mixedShortfall = useMemo(() => {
    if (method !== 'mixed') return 0;
    return round2(Math.max(0, toPay - cashNum - cardNum));
  }, [cardNum, cashNum, method, toPay]);

  const cashPaidEnough = method === 'cash' && cashNum >= toPay && cashNum > 0;
  const mixedCovered =
    method === 'mixed' && cashNum > 0 && cardNum > 0 && round2(cashNum + cardNum) >= toPay;

  const guardCheckout = useCallback(() => {
    if (checkoutDisabled || isPending) return false;
    if (toPay <= 0) {
      toast.error(t('pos.cartEmpty'));
      return false;
    }
    return true;
  }, [checkoutDisabled, isPending, t, toPay]);

  const handlePrintReceiptChange = useCallback((event) => {
    const next = Boolean(event.target.checked);
    setPrintReceiptEnabled(next);
    setPosReceiptPrintEnabled(next);
  }, []);

  const extras = useMemo(
    () => ({
      pharmacyPinfl: pinfl.trim() || undefined,
      pharmacyLoyaltyPhone: loyaltyPhone.trim() || undefined,
      pharmacyPayMethod: method,
      pharmacyDmed: method === 'insurance' || undefined,
    }),
    [loyaltyPhone, method, pinfl],
  );

  const submitCard = useCallback(
    (type) => {
      if (!guardCheckout()) return;
      const resolved = type || cardType;
      if (!resolved) return;

      setSelectedCardType(resolved);

      if (method === 'mixed') {
        const cash = clampCash(cashNum, toPay);
        const card = round2(Math.max(0, toPay - cash));
        if (cash <= 0 || card <= 0) {
          toast.error(t('pharmacyCashier.pay.needMixedCover'));
          return;
        }
        onConfirm({
          paymentMethod: 'MIXED',
          receiptType: 'SALE',
          cardType: resolved,
          cashAmount: cash,
          cardAmount: card,
          amountTendered: cash,
          printReceipt: printReceiptEnabled,
          ...extras,
        });
        return;
      }

      onConfirm({
        paymentMethod: 'CARD',
        receiptType: 'SALE',
        cardType: resolved,
        amountTendered: toPay,
        printReceipt: printReceiptEnabled,
        ...extras,
      });
    },
    [cardType, cashNum, extras, guardCheckout, method, onConfirm, printReceiptEnabled, t, toPay],
  );

  const submitSale = useCallback(() => {
    if (!guardCheckout()) return;

    if (method === 'cash') {
      const amountTendered = cashNum > 0 ? cashNum : toPay;
      if (amountTendered < toPay) {
        toast.error(t('pharmacyCashier.pay.needFullCash'));
        return;
      }
      onConfirm({
        paymentMethod: 'CASH',
        receiptType: 'SALE',
        cardType: null,
        amountTendered,
        printReceipt: printReceiptEnabled,
        ...extras,
      });
      return;
    }

    if (method === 'card') {
      if (!cardType) return;
      submitCard(cardType);
      return;
    }

    if (method === 'mixed') {
      if (!mixedCovered) {
        toast.error(t('pharmacyCashier.pay.needMixedCover'));
        return;
      }
      if (!cardType) return;
      submitCard(cardType);
      return;
    }

    if (method === 'insurance') {
      if (pinfl.trim().length < 14) {
        toast.error(t('pharmacyCashier.pay.pinflRequired'));
        return;
      }
      onConfirm({
        paymentMethod: 'CASHLESS',
        receiptType: 'SALE',
        cardType: null,
        amountTendered: toPay,
        printReceipt: printReceiptEnabled,
        ...extras,
      });
    }
  }, [
    cardType,
    cashNum,
    extras,
    guardCheckout,
    method,
    mixedCovered,
    onConfirm,
    pinfl,
    printReceiptEnabled,
    submitCard,
    t,
    toPay,
  ]);

  const saleHint = useMemo(() => {
    if (method === 'card') return t('pharmacyCashier.pay.hintPickOrSaleCard');
    if (method === 'mixed' && !mixedCovered) return t('pharmacyCashier.pay.hintMixedFill');
    if (method === 'mixed') return t('pharmacyCashier.pay.hintMixedCard');
    if (method === 'insurance') return t('pharmacyCashier.pay.hintDmed');
    return null;
  }, [method, mixedCovered, t]);

  const saleDisabled =
    checkoutDisabled ||
    isPending ||
    toPay <= 0 ||
    (method === 'cash' && cashNum > 0 && cashNum < toPay) ||
    (method === 'card' && !cardType) ||
    (method === 'mixed' && (!mixedCovered || !cardType)) ||
    (method === 'insurance' && pinfl.trim().length < 14);

  return {
    method,
    setMethod,
    cashInput,
    setCashInput,
    cardInput,
    setCardInput,
    selectedCardType,
    pinfl,
    setPinfl,
    loyaltyPhone,
    setLoyaltyPhone,
    toPay,
    changeDue,
    mixedShortfall,
    cashPaidEnough,
    mixedCovered,
    printReceiptEnabled,
    handlePrintReceiptChange,
    submitSale,
    submitCard,
    saleDisabled,
    saleHint,
    quickCash: PHARMACY_QUICK_CASH,
  };
}

function clampCash(cash, total) {
  const n = Number(cash);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return round2(Math.min(n, total));
}
