/** Same gap as the barcode wedge: faster than a person types. */
export const REGISTER_SCAN_GAP_MS = 80;

/**
 * A USB scanner dumps the code as one fast burst into the check search field.
 * That burst must not open the product list over the receipt.
 */
export function nextRegisterScanBurst(prev, value, now = Date.now()) {
  const text = String(value ?? '');
  const trimmed = text.trim();
  const prevLen = prev?.len ?? 0;
  const gap = now - (prev?.at ?? 0);
  const grew = text.length > prevLen;
  const delta = text.length - prevLen;
  const fastChars = prevLen > 0 && gap >= 0 && gap <= REGISTER_SCAN_GAP_MS;
  const pastedCode = delta >= 6;
  const burst = Boolean(trimmed && grew && (fastChars || pastedCode));
  return { at: now, len: text.length, burst };
}
