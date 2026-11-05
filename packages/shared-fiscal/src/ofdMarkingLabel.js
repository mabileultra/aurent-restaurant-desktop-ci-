const CRYPTO_TAIL = /(91|92|93).{1,64}$/;
const MIN_CODE_LENGTH = 20;
const OFD_LABEL_MAX = 63;

function stripScannerPrefix(raw) {
  if (raw == null) return '';
  let value = String(raw).replace(/^\uFEFF/, '').replace(/\u0000/g, '').trim();
  if (value.startsWith(']') && value.length > 3) {
    value = value.slice(3).trim();
  }
  return value;
}

/** КИ: 01+GTIN+21+serial, без криптохвоста 91/92/93. */
export function toIdentificationMarkingCode(raw) {
  let value = stripScannerPrefix(raw);
  if (!value) return '';

  const gs = value.indexOf('\u001d');
  if (gs >= 0) {
    value = value.slice(0, gs);
  }

  if (value.length > 18 && value.startsWith('01') && value.startsWith('21', 16)) {
    const serialAndTail = value.slice(18);
    const match = serialAndTail.match(CRYPTO_TAIL);
    if (match && match.index != null) {
      return value.slice(0, 18 + match.index);
    }
    return value;
  }

  const match = value.match(CRYPTO_TAIL);
  if (match && match.index != null && match.index >= MIN_CODE_LENGTH) {
    return value.slice(0, match.index);
  }
  return value;
}

/**
 * Поле Label фискального чека для ASL Belgisi:
 * только КИ (не полный DataMatrix), длина ≤ 63.
 */
export function toOfdMarkingLabel(raw) {
  const identification = toIdentificationMarkingCode(raw);
  if (!identification || identification.length < MIN_CODE_LENGTH) {
    return '';
  }
  return identification.length > OFD_LABEL_MAX
    ? identification.slice(0, OFD_LABEL_MAX)
    : identification;
}
