import { isFiscalDateTime } from '../../shared/fiscalMoney';
import { FD_RECEIPT_TYPE, FD_SUM_TOLERANCE_TIYIN } from './fiscalDriveConstants';

const isNonNegativeInt = (v) => Number.isInteger(v) && v >= 0;

/**
 * Проверка чека до отправки в ФМ (правила ОФД из документации 0400).
 * Возвращает список ошибок; пустой список — чек можно регистрировать.
 */
export function validateFiscalDriveReceipt(receipt) {
  const errors = [];
  const items = Array.isArray(receipt?.Items) ? receipt.Items : [];

  if (!isFiscalDateTime(receipt?.Time)) {
    errors.push('В чеке нет даты и времени (Time)');
  }
  if (receipt?.RefundInfo && !/^\d{14}$/.test(String(receipt.RefundInfo.DateTime || ''))) {
    errors.push('В возврате пустая дата исходного чека (RefundInfo.DateTime)');
  }
  if (!isNonNegativeInt(receipt?.ReceivedCash) || !isNonNegativeInt(receipt?.ReceivedCard)) {
    errors.push('Сумма оплаты должна быть целым неотрицательным числом в тийинах');
  }
  if (items.length === 0) {
    errors.push('В чеке нет позиций');
  }

  let itemsTotal = 0;
  items.forEach((item, i) => {
    const name = item?.Name || `#${i + 1}`;
    if (!Number.isInteger(item?.Price) || item.Price <= 0) {
      errors.push(`${name}: цена должна быть больше 0`);
    }
    if (!isNonNegativeInt(item?.Discount) || !isNonNegativeInt(item?.Other)) {
      errors.push(`${name}: скидка и «прочее» не могут быть отрицательными`);
    }
    const net = (item?.Price || 0) - (item?.Discount || 0) - (item?.Other || 0);
    if (net < 0) {
      errors.push(`${name}: скидка больше цены`);
    }
    if (!Number.isInteger(item?.Amount) || item.Amount <= 0) {
      errors.push(`${name}: количество должно быть больше 0`);
    }
    if (!item?.SPIC) {
      errors.push(`${name}: не указан ИКПУ`);
    }
    itemsTotal += net;
  });

  // Аванс/кредит оплачиваются частично — равенство сумм только для покупки.
  if (receipt?.Type === FD_RECEIPT_TYPE.PURCHASE && items.length > 0) {
    const received = (receipt.ReceivedCash || 0) + (receipt.ReceivedCard || 0);
    if (Math.abs(received - itemsTotal) > FD_SUM_TOLERANCE_TIYIN) {
      errors.push(
        `Оплата (${received / 100}) не совпадает с суммой позиций (${itemsTotal / 100}) больше чем на 100 сум`,
      );
    }
  }

  return errors;
}
