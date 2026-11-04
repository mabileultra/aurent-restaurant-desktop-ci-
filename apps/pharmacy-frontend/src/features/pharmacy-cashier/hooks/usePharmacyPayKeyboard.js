import { useEffect } from 'react';

function isEditableTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"], input, textarea, select'));
}

function isPatientField(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('.pharmacy-pay-rail__patient'));
}

/**
 * Клавиатура для панели оплаты аптеки (ПК / numpad).
 * F6–F8 методы, F5 ровно, цифры → сумма, Enter → продажа.
 * F9 — чек (см. usePharmacyHotkeys).
 */
export function usePharmacyPayKeyboard({
  enabled,
  method,
  setMethod,
  setExactAmount,
  appendCashDigit,
  backspaceCash,
  clearCash,
  submitSale,
  saleDisabled,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'F6') {
        e.preventDefault();
        setMethod('cash');
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        setMethod('card');
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setMethod('mixed');
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        if (method === 'cash' || method === 'mixed') {
          setExactAmount();
        }
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        if (isPatientField(e.target)) return;
        if (isEditableTarget(e.target) && !e.target.closest?.('.pharmacy-pay-rail')) return;
        if (saleDisabled) return;
        e.preventDefault();
        e.stopPropagation();
        submitSale();
        return;
      }

      const cashMode = method === 'cash' || method === 'mixed';
      if (!cashMode) return;
      if (isEditableTarget(e.target)) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        appendCashDigit(e.key);
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspaceCash();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Escape') {
        // Escape handled globally; Delete clears tendered
        if (e.key === 'Delete') {
          e.preventDefault();
          clearCash();
        }
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [
    appendCashDigit,
    backspaceCash,
    clearCash,
    enabled,
    method,
    saleDisabled,
    setExactAmount,
    setMethod,
    submitSale,
  ]);
}
