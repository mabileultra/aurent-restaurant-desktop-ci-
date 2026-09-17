import { isPharmacyMarkingCode } from './pharmacyMarkingCode';

/**
 * Одно поле поиска на кассе: имя / штрихкод / DataMatrix КМ.
 * Отдельного места под маркировку нет — всё сюда.
 */
export function classifyPharmacySearchScan(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return { kind: 'empty', value: '' };

  if (isPharmacyMarkingCode(value)) {
    return { kind: 'marking', value };
  }

  // Чистый EAN/UPC — штрихкод
  if (/^\d{8}$/.test(value) || /^\d{12,14}$/.test(value)) {
    return { kind: 'barcode', value };
  }

  return { kind: 'text', value };
}
