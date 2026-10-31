/** EAN-13 / GTIN-14 / без check digit — варианты для offline by-barcode. */
function barcodeScanVariants(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return [];
  const digits = trimmed.replace(/\D/g, '');
  const out = [];
  const push = (code) => {
    if (code && !out.includes(code)) out.push(code);
  };
  push(trimmed);
  if (digits && digits !== trimmed) push(digits);
  if (digits.length === 13) {
    push(digits.slice(0, 12));
    push(`0${digits}`);
  }
  if (digits.length === 14 && digits.startsWith('0')) {
    push(digits.slice(1));
    if (digits.startsWith('00')) push(digits.slice(2));
  }
  if (digits.length === 12) push(`0${digits}`);
  return out;
}

module.exports = { barcodeScanVariants };
