import { isMarkingCode } from '../../marking';

/**
 * Жёсткое разделение входа на кассе.
 * marking → только КМ / ASL-путь
 * barcode → обычная продажа в налог (ASL не вызывается)
 */
export function classifyPosScanInput(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return 'empty';
  if (isMarkingCode(value)) return 'marking';
  return 'barcode';
}
