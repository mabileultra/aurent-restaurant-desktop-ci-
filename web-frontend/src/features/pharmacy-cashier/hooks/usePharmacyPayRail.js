import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { round2 } from '../../../utils/taxAmounts';
import {
  isPosReceiptPrintEnabled,
  setPosReceiptPrintEnabled,
} from '../../../utils/receiptPrintPreference';
import { amountStr, parseTenderedInput } from '../../cashier/components/payment/posPaymentConstants';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../cashier/constants/paymentCardProviders';
import { appendKeypadDigit } from '../../cashier/components/NumericKeypad';

export const PHARMACY_PAY_METHODS = ['cash', 'card', 'mixed', 'insurance'];

export const PHARMACY_QUICK_CASH = [
  { amount: 10000, mode: 'add', label: '+10 000' },
  { amount: 20000, mode: 'add', label: '+20 000' },
  { amount: 50000, mode: 'add', label: '+50 000' },
  { amount: 100000, mode: 'add', label: '+100 000' },
  { amount: 200000, mode: 'add', label: '+200 000' },
];

/**
 * Аптечная оплата. Смешанная — как в продукте: часть налом + остаток картой.
 * Экранного numpad нет — сумма с физклавиатуры и быстрого ввода купюр.
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
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [pinfl, setPinfl] = useState('');
  const [loyaltyPhone, setLoyaltyPhone] = useState('');
  const [printReceiptEnabled, setPrintReceiptEnabled] = useState(isPosReceiptPrintEnabled);
  const prevToPayRef = useRef(0);

  const toPay = round2(total);
  const defaultCardType = ENABLED_PAYMENT_CARD_PROVIDERS[0]?.cardType ?? null;

  useEffect(() => {
    if (toPay <= 0) {
      setCashInput('');
      setSelectedCardType(null);
      prevToPayRef.current = 0;
      return;
    }
    const prev = prevToPayRef.current;
    prevToPayRef.current = toPay;
    if (prev <= 0 || Math.abs(prev - toPay) < 0.005) return;
    // Если стояло «ровно» под старый итог — подтянуть, иначе сдача/остаток залипают.
    setCashInput((current) => {
      const cur = parseTenderedInput(current);
      if (cur > 0 && Math.abs(cur - prev) < 0.005) {
        return amountStr(toPay);
      }
      return current;
    });
  }, [toPay]);

  useEffect(() => {
    if (method !== 'card' && method !== 'mixed') {
      setSelectedCardType(null);
    }
    if (method === 'card') {
      setCashInput('');
    }
  }, [method]);

  const cashNum = parseTenderedInput(cashInput);
  const cardType = selectedCardType || defaultCardType;

  const changeDue = round2(Math.max(0, cashNum - toPay));
  const cashPaidEnough = cashNum >= toPay && cashNum > 0;
  const cardRemainder =
    cashNum > 0 && cashNum < toPay ? round2(toPay - cashNum) : 0;
  const hasPartialCash = cardRemainder > 0;
  const cardPayBlocked = cashNum >= toPay && cashNum > 0;

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

  const setExactAmount = useCallback(() => {
    if (toPay <= 0) return;
    setCashInput(amountStr(toPay));
  }, [toPay]);

  const appendCashDigit = useCallback((digit) => {
    setCashInput((prev) => appendKeypadDigit(prev, digit));
  }, []);

  const backspaceCash = useCallback(() => {
    setCashInput((prev) => (prev ? prev.slice(0, -1) : ''));
  }, []);

  const clearCash = useCallback(() => {
    setCashInput('');
  }, []);

  const submitCard = useCallback(
    (type) => {
      if (!guardCheckout()) return;
      const resolved = type || cardType;
      if (!resolved) return;
      if (cardPayBlocked && method !== 'mixed') return;

      setSelectedCardType(resolved);

      if (hasPartialCash || method === 'mixed') {
        if (!hasPartialCash) {
          toast.error(t('pharmacyCashier.pay.hintMixedProduct'));
          return;
        }
        const entered = cashNum;
        onConfirm({
          paymentMethod: 'MIXED',
          receiptType: 'SALE',
          cardType: resolved,
          cashAmount: entered,
          cardAmount: cardRemainder,
          amountTendered: entered,
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
    [
      cardPayBlocked,
      cardRemainder,
      cardType,
      cashNum,
      extras,
      guardCheckout,
      hasPartialCash,
      method,
      onConfirm,
      printReceiptEnabled,
      t,
      toPay,
    ],
  );

  const submitSale = useCallback(() => {
    if (!guardCheckout()) return;

    if (method === 'cash') {
      if (hasPartialCash) {
        if (!cardType) return;
        submitCard(cardType);
        return;
      }
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
      if (!hasPartialCash) {
        toast.error(t('pharmacyCashier.pay.hintMixedProduct'));
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
    hasPartialCash,
    method,
    onConfirm,
    pinfl,
    printReceiptEnabled,
    submitCard,
    t,
    toPay,
  ]);

  const saleHint = useMemo(() => {
    if (method === 'card') return t('pharmacyCashier.pay.hintPickOrSaleCard');
    if ((method === 'mixed' || method === 'cash') && hasPartialCash) {
      return t('pharmacyCashier.pay.hintMixedPickCard');
    }
    if (method === 'mixed' && !hasPartialCash) return t('pharmacyCashier.pay.hintMixedProduct');
    if (method === 'insurance') return t('pharmacyCashier.pay.hintDmed');
    return null;
  }, [hasPartialCash, method, t]);

  const saleDisabled =
    checkoutDisabled ||
    isPending ||
    toPay <= 0 ||
    (method === 'cash' && cashNum > 0 && cashNum < toPay && !cardType) ||
    (method === 'card' && !cardType) ||
    (method === 'mixed' && (!hasPartialCash || !cardType)) ||
    (method === 'insurance' && pinfl.trim().length < 14);

  return {
    method,
    setMethod,
    cashInput,
    setCashInput,
    selectedCardType,
    pinfl,
    setPinfl,
    loyaltyPhone,
    setLoyaltyPhone,
    toPay,
    changeDue,
    cashPaidEnough,
    cardRemainder,
    hasPartialCash,
    cardPayBlocked,
    printReceiptEnabled,
    handlePrintReceiptChange,
    submitSale,
    submitCard,
    saleDisabled,
    saleHint,
    setExactAmount,
    appendCashDigit,
    backspaceCash,
    clearCash,
    quickCash: PHARMACY_QUICK_CASH,
  };
}
