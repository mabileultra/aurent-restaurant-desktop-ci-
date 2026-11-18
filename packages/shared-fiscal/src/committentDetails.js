/**
 * @file committentDetails.js
 * Single source of truth for committent STIR (9 digits) and JShShIR/PINFL (14 digits)
 * across Multikassa (`commitent_tin`), FiscalDrive (`CommissionInfo`), ONKM, and receipts (AUR-7).
 */

export const COMMITTENT_TIN_LENGTH = 9;
export const COMMITTENT_PINFL_LENGTH = 14;

const STRICT_DIGITS_RE = /^\d+$/;
const ALL_ZEROS_RE = /^0+$/;

/**
 * Validates and classifies a single raw committent candidate string.
 * - 9 digits (non-zero) -> `{ kind: 'TIN', value }`
 * - 14 digits (non-zero) -> `{ kind: 'PINFL', value }`
 * - Anything else -> `null`
 * @param {unknown} rawValue
 * @returns {{ kind: 'TIN' | 'PINFL', value: string } | null}
 */
export function parseCommittentIdentifier(rawValue) {
  if (rawValue === null || rawValue === undefined) return null;
  const trimmed = String(rawValue).trim();
  if (!trimmed || !STRICT_DIGITS_RE.test(trimmed) || ALL_ZEROS_RE.test(trimmed)) {
    return null;
  }
  if (trimmed.length === COMMITTENT_TIN_LENGTH) {
    return { kind: 'TIN', value: trimmed };
  }
  if (trimmed.length === COMMITTENT_PINFL_LENGTH) {
    return { kind: 'PINFL', value: trimmed };
  }
  return null;
}

/**
 * Resolves validated committent TIN (9 digits) or PINFL (14 digits) from a cart line or sale item.
 * Used identically by Multikassa, FiscalDrive, ONKM, and receipt renderers (HTML + ESC/POS).
 * @param {object | null | undefined} item
 * @returns {{ kind: 'TIN' | 'PINFL', value: string } | null}
 */
export function resolveItemCommittent(item) {
  if (!item || typeof item !== 'object') return null;

  const candidates = [
    item.commissionTin,
    item.commitentTin,
    item.commitent_tin,
    item.commissionPinfl,
    item.commitentPinfl,
    item.CommissionInfo?.TIN,
    item.CommissionInfo?.PINFL,
  ];

  for (const candidate of candidates) {
    const parsed = parseCommittentIdentifier(candidate);
    if (parsed) return parsed;
  }

  return null;
}

/**
 * Returns `commitent_tin` string for Multikassa operation items (empty string if absent/invalid).
 * @param {object | null | undefined} item
 * @returns {string}
 */
export function resolveMultikassaCommitentTin(item) {
  return resolveItemCommittent(item)?.value || '';
}

/**
 * Returns `CommissionInfo` object (`{ TIN }` or `{ PINFL }`) for FiscalDrive 0400 receipt items,
 * or `null` when absent/invalid.
 * @param {object | null | undefined} item
 * @returns {{ TIN: string } | { PINFL: string } | null}
 */
export function buildFiscalDriveCommissionInfo(item) {
  const resolved = resolveItemCommittent(item);
  if (!resolved) return null;
  return resolved.kind === 'PINFL' ? { PINFL: resolved.value } : { TIN: resolved.value };
}

/**
 * Formats committent receipt label and value in Uzbek ("Komitent (STIR): ..." / "Komitent (JShShIR): ...").
 * @param {object | null | undefined} item
 * @param {{ committentTin?: string, committentPinfl?: string }} [labels]
 * @returns {{ kind: 'TIN' | 'PINFL', label: string, value: string, text: string } | null}
 */
export function formatItemCommittentReceiptLine(item, labels = {}) {
  const resolved = resolveItemCommittent(item);
  if (!resolved) return null;
  const label =
    resolved.kind === 'PINFL'
      ? labels.committentPinfl || 'Komitent (JShShIR)'
      : labels.committentTin || 'Komitent (STIR)';
  return {
    kind: resolved.kind,
    label,
    value: resolved.value,
    text: `${label}: ${resolved.value}`,
  };
}

function findMatchingCartItem(saleItem, cartItems, index, usedIndices) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return null;

  const directAtIdx = cartItems[index];
  if (directAtIdx && !usedIndices.has(index)) {
    const sameId =
      saleItem?.productId != null &&
      directAtIdx.productId != null &&
      String(saleItem.productId) === String(directAtIdx.productId);
    const sameName =
      saleItem?.productName &&
      directAtIdx.name &&
      String(saleItem.productName).trim() === String(directAtIdx.name).trim();
    const sameSku =
      saleItem?.productSku &&
      directAtIdx.sku &&
      String(saleItem.productSku).trim() === String(directAtIdx.sku).trim();
    if (sameId || sameName || sameSku) {
      usedIndices.add(index);
      return directAtIdx;
    }
  }

  for (let i = 0; i < cartItems.length; i += 1) {
    if (usedIndices.has(i)) continue;
    const candidate = cartItems[i];
    if (!candidate) continue;
    if (
      saleItem?.productId != null &&
      candidate.productId != null &&
      String(saleItem.productId) === String(candidate.productId)
    ) {
      usedIndices.add(i);
      return candidate;
    }
    if (
      saleItem?.productSku &&
      candidate.sku &&
      String(saleItem.productSku).trim() === String(candidate.sku).trim()
    ) {
      usedIndices.add(i);
      return candidate;
    }
    if (
      saleItem?.ikpu &&
      candidate.ikpu &&
      String(saleItem.ikpu).trim() === String(candidate.ikpu).trim()
    ) {
      usedIndices.add(i);
      return candidate;
    }
    if (
      saleItem?.productName &&
      candidate.name &&
      String(saleItem.productName).trim() === String(candidate.name).trim()
    ) {
      usedIndices.add(i);
      return candidate;
    }
  }

  if (directAtIdx && !usedIndices.has(index)) {
    usedIndices.add(index);
    return directAtIdx;
  }

  return null;
}

/**
 * Attaches committent TIN/PINFL from cart items onto `sale.items` on the frontend
 * (in the style of `withCardReceiptDetails`), without altering backend request payloads.
 * @param {object | null | undefined} sale
 * @param {Array<object>} [cartItems]
 * @returns {object | null | undefined}
 */
export function withSaleCommittentDetails(sale, cartItems = []) {
  if (!sale || typeof sale !== 'object' || !Array.isArray(sale.items)) {
    return sale;
  }

  const usedIndices = new Set();
  const nextItems = sale.items.map((saleItem, index) => {
    const matchedCart = findMatchingCartItem(saleItem, cartItems, index, usedIndices);
    const resolved = resolveItemCommittent(saleItem) || resolveItemCommittent(matchedCart);
    if (!resolved) {
      return saleItem;
    }
    return {
      ...saleItem,
      commissionTin: resolved.kind === 'TIN' ? resolved.value : (saleItem.commissionTin ?? null),
      commissionPinfl:
        resolved.kind === 'PINFL' ? resolved.value : (saleItem.commissionPinfl ?? null),
      commitentTin: resolved.value,
    };
  });

  return {
    ...sale,
    items: nextItems,
  };
}
