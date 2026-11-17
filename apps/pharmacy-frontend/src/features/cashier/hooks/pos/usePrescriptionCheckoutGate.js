import { useCallback } from 'react';
import { create } from 'zustand';
import {
  assertCartPrescriptionReady,
  cartHasPrescriptionRequiredItems,
  isPrescriptionExemptPayment,
  resolveCartPrescriptionNumber,
  validatePrescriptionNumber,
} from '@aurent/shared-fiscal';
import { useCartStore } from '../../../../store/cartStore';

/**
 * Состояние модалки номера рецепта — общее для кассы: шлюз оплаты, индикатор и сама
 * модалка живут в разных ветках дерева и не связаны пропсами.
 */
export const usePrescriptionGateStore = create(() => ({
  isOpen: false,
  /** Прерванное действие оплаты — продолжается после ввода номера. */
  pendingAction: null,
}));

const closeGate = () => usePrescriptionGateStore.setState({ isOpen: false, pendingAction: null });

/**
 * Шлюз номера электронного рецепта (AUR-3).
 * Чек с рецептурным препаратом без номера не уходит в продажу: открывается модалка,
 * после подтверждения прерванная оплата продолжается без повторного нажатия.
 */
export function usePrescriptionCheckoutGate() {
  const isOpen = usePrescriptionGateStore((state) => state.isOpen);
  const prescriptionNumber = useCartStore((state) => state.prescriptionNumber);
  const hasPrescriptionItems = useCartStore((state) =>
    cartHasPrescriptionRequiredItems(state.items));

  /**
   * @param {() => void} [resumeAction] — что выполнить после ввода номера
   * @param {object} [payment] — возврат (receiptType RETURN/REFUND) номер не требует
   * @returns {boolean} true — номер не нужен или уже указан
   */
  const ensurePrescriptionReady = useCallback((resumeAction, payment) => {
    if (isPrescriptionExemptPayment(payment)) return true;
    const cart = useCartStore.getState();
    if (assertCartPrescriptionReady(cart.items, cart.prescriptionNumber).ok) return true;
    usePrescriptionGateStore.setState({
      isOpen: true,
      pendingAction: typeof resumeAction === 'function' ? resumeAction : null,
    });
    return false;
  }, []);

  /** Открыть модалку для правки номера без запуска оплаты. */
  const openEditor = useCallback(() => {
    usePrescriptionGateStore.setState({ isOpen: true, pendingAction: null });
  }, []);

  /**
   * @returns {{ ok: true, value: string } | { ok: false, issue: 'missing' | 'invalid' }}
   */
  const confirm = useCallback((nextPrescriptionNumber) => {
    const validation = validatePrescriptionNumber(nextPrescriptionNumber);
    if (!validation.ok) return validation;
    useCartStore.getState().setPrescriptionNumber(validation.value);
    const { pendingAction } = usePrescriptionGateStore.getState();
    closeGate();
    pendingAction?.();
    return validation;
  }, []);

  /** Добавляет номер рецепта в оплату — корзина читается в момент пробития, а не рендера. */
  const attachToPayment = useCallback((payment) => {
    if (isPrescriptionExemptPayment(payment)) return payment;
    const cart = useCartStore.getState();
    const resolved = resolveCartPrescriptionNumber(cart.items, cart.prescriptionNumber);
    return resolved ? { ...payment, prescriptionNumber: resolved } : payment;
  }, []);

  return {
    isOpen,
    prescriptionNumber,
    hasPrescriptionItems,
    ensurePrescriptionReady,
    openEditor,
    close: closeGate,
    confirm,
    attachToPayment,
  };
}
