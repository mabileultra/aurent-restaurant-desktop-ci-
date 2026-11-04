/** Значения полей JSON-чека FiscalDriveService (ФМ 0400). */
export const FD_RECEIPT_TYPE = Object.freeze({
  PURCHASE: 0,
  ADVANCE: 1,
  CREDIT: 2,
});

export const FD_OPERATION = Object.freeze({
  SALE: 0,
  REFUND: 1,
});

export const FD_PAYMENT_TYPE = Object.freeze({
  CASH: 1,
  CARD: 2,
  QR: 3,
  MIXED: 4,
});

export const FD_DEFAULT_VAT_PERCENT = 12;

/** Допуск между оплатой и суммой позиций: 100 сум в тийинах. */
export const FD_SUM_TOLERANCE_TIYIN = 10000;

export const FD_LIMITS = Object.freeze({
  NAME: 63,
  BARCODE: 63,
  LABEL: 63,
  LABELS_PER_ITEM: 300,
  SPIC: 18,
  PACKAGE_CODE: 20,
});

/** Количество в чеке: 1 шт = 1000, 0,5 кг = 500. */
export const FD_AMOUNT_SCALE = 1000;

export const FD_DEFAULT_LOCATION = Object.freeze({
  Latitude: 41.3111,
  Longitude: 69.2797,
});
