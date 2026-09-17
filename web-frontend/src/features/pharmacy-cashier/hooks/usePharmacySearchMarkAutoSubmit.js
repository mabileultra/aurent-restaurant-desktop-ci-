import { useEffect, useRef } from 'react';
import { isCompletePharmacyMarkingScan } from '../utils/pharmacyMarkingCode';

/**
 * Если в поиск вставили/набрали полный DataMatrix — сразу в чек, без кнопки КМ.
 */
export function usePharmacySearchMarkAutoSubmit({
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
