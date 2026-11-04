/** Код упаковки Tasnif для строки корзины; '' если не найден. */
export function resolveLinePackageCode(line) {
  const direct =
    line.packageCode != null && String(line.packageCode).trim() !== ''
      ? String(line.packageCode).trim()
      : '';
  if (direct) return direct;

  const candidates = [line.externalId, line.sku, line.productExternalId, line.id];
  for (const raw of candidates) {
    const v = String(raw || '').trim();
    if (!v) continue;
    // 03214001014000010:1546940
    const colon = v.match(/^\d{10,}:(\d{3,})$/);
    if (colon) return colon[1];
    // IKPU-03214001014000010-P1546940
    const ikpuSku = v.match(/^IKPU-\d{10,}-P(\d{3,})$/i);
    if (ikpuSku) return ikpuSku[1];
  }

  const unit =
    line.unitMeasureCode != null && String(line.unitMeasureCode).trim() !== ''
      ? String(line.unitMeasureCode).trim()
      : '';
  // «1» — код единицы измерения, не упаковка Tasnif
  if (unit && unit !== '1') return unit;
  return '';
}
