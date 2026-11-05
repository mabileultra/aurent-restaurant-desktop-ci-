/** Признаки аптечного товара из карточки МХИК — без ручных галочек. */

export function inferMarkedProduct(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.markedProduct === true || item.label === true) return true;
  if (item.label === 1 || item.label === '1') return true;
  return false;
}

export function inferPrescriptionRequired(item) {
  const text = [
    item?.name,
    item?.title,
    item?.description,
    item?.packageName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!text) return false;
  return /рецепт|рецептурн|prescription|\brx\b|retsept/.test(text);
}

export function applyMxikFlags(form, item) {
  return {
    ...form,
    markedProduct: inferMarkedProduct(item),
    prescriptionRequired: inferPrescriptionRequired(item),
  };
}
