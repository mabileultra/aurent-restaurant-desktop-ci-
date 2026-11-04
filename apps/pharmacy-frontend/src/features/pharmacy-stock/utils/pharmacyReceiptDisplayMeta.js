/** Подписи магазина / поставщика / типа / оплаты для карточки прихода. */

export function resolveStoreName(receipt, stores = []) {
  if (receipt?.storeName) return receipt.storeName;
  const id = receipt?.storeId;
  if (id == null) return null;
  const hit = stores.find((s) => Number(s.id) === Number(id));
  return hit?.name || hit?.title || null;
}

export function resolveSupplierName(receipt, suppliers = []) {
  if (receipt?.supplierName) return receipt.supplierName;
  const id = receipt?.supplierId;
  if (!id) return null;
  const list = Array.isArray(suppliers) ? suppliers : (suppliers?.content || []);
  const hit = list.find((s) => String(s.id) === String(id));
  return hit?.name || null;
}

export function receiptTypeLabel(receiptType, t) {
  if (receiptType === 'OPENING') return t('pharmacyStock.receiptTypeOpening');
  return t('pharmacyStock.receiptTypeReceipt');
}

export function paymentTypeLabel(paymentType, t) {
  if (paymentType === 'DEBT' || paymentType === 'CREDIT') {
    return t('pharmacyStock.paymentDebt');
  }
  if (paymentType === 'CASH' || paymentType === 'CASHLESS') {
    return t('pharmacyStock.paymentCash');
  }
  return paymentType || null;
}
