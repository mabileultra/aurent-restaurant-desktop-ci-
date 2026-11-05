import { useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Хоткеи аптечной кассы (только пока смонтирован PharmacyPosPage).
 * F2 — поиск/скан, F3 — МНН/аналоги.
 * F6–F12 оплата — usePharmacyPayKeyboard (tall-stack).
 * Esc — очистить чек (если есть позиции), иначе сброс поиска.
 */
export function usePharmacyHotkeys({
  t,
  enabled,
  focusSearch,
  focusCart,
  itemsLength,
  payOpen,
  returnOpen,
  discountOpen,
  qtyModalOpen,
  weightModalOpen,
  onClosePayment,
  onClearCart,
  clearSearch,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (payOpen) {
          e.preventDefault();
          onClosePayment?.();
          return;
        }
        if (returnOpen || discountOpen || qtyModalOpen || weightModalOpen) {
          return;
        }
        e.preventDefault();
        if (itemsLength > 0) {
          onClearCart?.();
          return;
        }
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
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    enabled,
    t,
    focusSearch,
    focusCart,
    itemsLength,
    payOpen,
    returnOpen,
    discountOpen,
    qtyModalOpen,
    weightModalOpen,
    onClosePayment,
    onClearCart,
    clearSearch,
  ]);
}
