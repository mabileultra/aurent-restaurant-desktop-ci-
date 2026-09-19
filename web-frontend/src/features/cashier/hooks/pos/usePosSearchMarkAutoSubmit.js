import { useEffect, useRef } from 'react';
import { isCompletePharmacyMarkingScan } from '../../../pharmacy-cashier/utils/pharmacyMarkingCode';

/** Полный DataMatrix в поиске — сразу в чек, без Enter (как в аптеке). */
export function usePosSearchMarkAutoSubmit({
  search,
  onSearchChange,
  onMarkingScan,
  enabled = true,
  delayMs = 140,
}) {
  const lastSubmittedRef = useRef('');

  useEffect(() => {
    if (!enabled || !onMarkingScan) return undefined;
    const value = String(search || '');
    if (!isCompletePharmacyMarkingScan(value)) {
      if (!value.trim()) lastSubmittedRef.current = '';
      return undefined;
    }
    if (lastSubmittedRef.current === value) return undefined;

    const timer = setTimeout(() => {
      lastSubmittedRef.current = value;
      onSearchChange?.('');
      onMarkingScan(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [search, onSearchChange, onMarkingScan, enabled, delayMs]);
}
