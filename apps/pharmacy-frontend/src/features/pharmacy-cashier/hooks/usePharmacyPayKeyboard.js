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
  return Boolean(target.closest('.pharmacy-pay-rail__patient, .pharmacy-pay-stack'));
}

/**
 * Хоткеи оплаты по ТЗ: F9 нал, F10 HUMO, F11 UzCard, F12 продажа,
 * F8 смешанный, F4 бесконтакт, F7 отложить, F6 пред.список, F5 ровно.
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
  onCash,
  onHumo,
  onUzcard,
  onHold,
  onParkedList,
  onMixed,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'F9') {
        e.preventDefault();
        (onCash || (() => setMethod('cash')))();
        return;
      }
      if (e.key === 'F10') {
        e.preventDefault();
        onHumo?.();
        return;
      }
      if (e.key === 'F11') {
        e.preventDefault();
        onUzcard?.();
        return;
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (!saleDisabled) submitSale();
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (onMixed) onMixed();
        else setMethod('mixed');
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setMethod('cashless');
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        onHold?.();
        return;
      }
      if (e.key === 'F6') {
        e.preventDefault();
        onParkedList?.();
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
        if (isPatientField(e.target) && e.target?.tagName === 'INPUT') return;
        if (isEditableTarget(e.target) && !e.target.closest?.('.pharmacy-pay-stack')) return;
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
      if (e.key === 'Delete') {
        e.preventDefault();
        clearCash();
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
    onCash,
    onHold,
    onHumo,
    onMixed,
    onParkedList,
    onUzcard,
    saleDisabled,
    setExactAmount,
    setMethod,
    submitSale,
  ]);
}
