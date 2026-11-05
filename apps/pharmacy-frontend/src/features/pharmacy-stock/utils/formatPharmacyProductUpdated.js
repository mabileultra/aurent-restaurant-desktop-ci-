/** Показать, что карточку меняли после создания. */
export function productWasEdited(product) {
  if (!product?.updatedAt || !product?.createdAt) return Boolean(product?.updatedAt);
  return String(product.updatedAt) !== String(product.createdAt);
}

export function formatProductUpdatedAt(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}
