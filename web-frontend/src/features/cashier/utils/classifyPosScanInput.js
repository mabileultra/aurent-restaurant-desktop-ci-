import { isPharmacyMarkingCode } from '../../pharmacy-cashier/utils/pharmacyMarkingCode';

/**
 * Жёсткое разделение входа на кассе.
 * marking → только КМ / ASL-путь
 * barcode → обычная продажа в налог (ASL не вызывается)
 */
export function classifyPosScanInput(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return 'empty';
  if (isPharmacyMarkingCode(value)) return 'marking';
  return 'barcode';
}
