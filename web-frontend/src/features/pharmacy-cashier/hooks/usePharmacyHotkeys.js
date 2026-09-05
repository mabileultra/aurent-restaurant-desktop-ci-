import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { isPosReceiptPrintEnabled } from '../../../utils/receiptPrintPreference';

function isEditableTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"], input, textarea, select'));
}

/**
 * Хоткеи аптечной кассы (только пока смонтирован PharmacyPosPage).
 * F2 — поиск, F3 — МНН/аналоги, Enter вне полей — быстрая продажа налом.
 */
export function usePharmacyHotkeys({
  t,
  enabled,
  focusSearch,
  itemsLength,
  total,
  shiftIsOpen,
  checkoutPending,
  payOpen,
  returnOpen,
  discountOpen,
  qtyModalOpen,
  weightModalOpen,
  markingOpen,
  onConfirmPayment,
  onClosePayment,
  clearSearch,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKey = (e) => {
      const blocked =
        payOpen
        || returnOpen
        || discountOpen
        || qtyModalOpen
        || weightModalOpen
        || markingOpen;

      if (e.key === 'Escape') {
        if (payOpen) {
          e.preventDefault();
          onClosePayment?.();
          return;
        }
        if (returnOpen || discountOpen || qtyModalOpen || weightModalOpen || markingOpen) {
          return;
        }
        e.preventDefault();
        clearSearch?.();
        focusSearch?.();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        focusSearch?.();
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        focusSearch?.();
        toast(t('pharmacyCashier.integrations.analogsHint'), { icon: '🔍' });
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isEditableTarget(e.target)) return;
        if (blocked || checkoutPending || !shiftIsOpen) return;
        if (!itemsLength || total <= 0) return;
        e.preventDefault();
        onConfirmPayment?.({
          paymentMethod: 'CASH',
          receiptType: 'SALE',
          cardType: null,
          amountTendered: total,
          printReceipt: isPosReceiptPrintEnabled(),
          pharmacyPayMethod: 'cash',
          pharmacyHotkey: 'Enter',
        });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    enabled,
    t,
    focusSearch,
    itemsLength,
    total,
    shiftIsOpen,
    checkoutPending,
    payOpen,
    returnOpen,
    discountOpen,
    qtyModalOpen,
    weightModalOpen,
    markingOpen,
    onConfirmPayment,
    onClosePayment,
    clearSearch,
  ]);
}
