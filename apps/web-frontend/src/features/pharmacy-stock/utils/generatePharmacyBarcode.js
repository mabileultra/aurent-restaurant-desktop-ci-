import { ean13CheckDigit } from '../../scales/utils/weightBarcode';

/**
 * Внутренний аптечный EAN-13 (префикс 29 — локальные коды).
 * Как «Создать» у штрихкода в Oson: заполняет поле, не открывает пустую строку.
 */
export function generatePharmacyBarcode() {
  const now = Date.now().toString().slice(-10);
  const body = `29${now}`;
  return `${body}${ean13CheckDigit(body)}`;
}
