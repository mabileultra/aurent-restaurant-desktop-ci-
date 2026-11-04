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

function methodLabel(method, t) {
  if (method === 'DEBT' || method === 'CREDIT') return t('pharmacyStock.paymentDebt');
  if (method === 'TRANSFER') return t('pharmacyStock.paymentTransfer');
  if (method === 'CARD') return t('pharmacyStock.paymentCard');
  if (method === 'CASH') return t('pharmacyStock.paymentCash');
  return method || null;
}

export function paymentTypeLabel(paymentType, t, receipt) {
  const payments = Array.isArray(receipt?.payments) ? receipt.payments : [];
  const debt = Number(receipt?.debtAmount) || 0;
  if (payments.length > 0) {
    const parts = payments
      .filter((p) => p?.method)
      .map((p) => methodLabel(p.method, t))
      .filter(Boolean);
    if (debt > 0) parts.push(t('pharmacyStock.paymentDebt'));
    if (parts.length > 1) return parts.join(' + ');
    if (parts.length === 1) return parts[0];
  }
  return methodLabel(paymentType, t);
}
