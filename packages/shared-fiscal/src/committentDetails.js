/**
 * @file committentDetails.js
 * Single source of truth for committent STIR (9 digits) and JShShIR/PINFL (14 digits)
 * across Multikassa (`commitent_tin`), FiscalDrive (`CommissionInfo`), ONKM, and receipts (AUR-7).
 *
 * Strict 2nd criterion requirement:
 * The value printed on the receipt MUST EXACTLY MATCH the value sent to the active fiscal provider.
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
 * Resolves committent TIN/PINFL from all possible fields (used by FiscalDrive and ONKM).
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
 * Resolves committent TIN for Multikassa operation items:
 * - Reads only legacy `commissionTin` / `commitentTin` / `commitent_tin`.
 * - 9 or 14 digits are accepted and sent as-is.
 * - NEW `commissionPinfl` field is NOT sent to Multikassa.
 * - Empty string '' if absent or invalid.
 * @param {object | null | undefined} item
 * @returns {string}
 */
export function resolveMultikassaCommitentTin(item) {
  if (!item || typeof item !== 'object') return '';
  const candidate = item.commissionTin ?? item.commitentTin ?? item.commitent_tin;
  const parsed = parseCommittentIdentifier(candidate);
  if (parsed && (parsed.kind === 'TIN' || parsed.kind === 'PINFL')) {
    return parsed.value;
  }
  return '';
}

/**
 * Returns `CommissionInfo` object (`{ TIN }` or `{ PINFL }`) for FiscalDrive 0400 receipt items,
 * or `null` when absent/invalid.
 * Preserves 1:1 legacy behavior.
 * @param {object | null | undefined} item
 * @returns {{ TIN: string } | { PINFL: string } | null}
 */
export function buildFiscalDriveCommissionInfo(item) {
  const resolved = resolveItemCommittent(item);
  if (!resolved) return null;
  return resolved.kind === 'PINFL' ? { PINFL: resolved.value } : { TIN: resolved.value };
}

/**
 * Resolves the active fiscal provider for a sale: 'FISCAL_DRIVE' or 'MULTIKASSA'.
 * @param {object | null | undefined} sale
 * @param {{ fiscalProvider?: string, capabilities?: object }} [options]
 * @returns {'FISCAL_DRIVE' | 'MULTIKASSA'}
 */
export function resolveSaleFiscalProvider(sale, options = {}) {
  const candidate =
    options?.fiscalProvider ||
    sale?.fiscalProvider ||
    sale?.fiscal?.fiscalProvider ||
    (sale?.multikassaSaleId ? 'MULTIKASSA' : null) ||
    options?.capabilities?.fiscalProvider ||
    'MULTIKASSA';
  return String(candidate).toUpperCase() === 'FISCAL_DRIVE' ? 'FISCAL_DRIVE' : 'MULTIKASSA';
}

/**
 * Resolves committent identifier strictly according to the active fiscal provider payload:
 * - MULTIKASSA: returns parsed identifier from resolveMultikassaCommitentTin(item),
 *   meaning NEW commissionPinfl produces null (not sent in payload, so absent from receipt).
 * - FISCAL_DRIVE: returns parsed identifier from buildFiscalDriveCommissionInfo(item).
 * @param {object | null | undefined} item
 * @param {'MULTIKASSA' | 'FISCAL_DRIVE'} [provider='MULTIKASSA']
 * @returns {{ kind: 'TIN' | 'PINFL', value: string } | null}
 */
export function resolveProviderItemCommittent(item, provider = 'MULTIKASSA') {
  if (!item || typeof item !== 'object') return null;
  const isFd = String(provider || '').toUpperCase() === 'FISCAL_DRIVE';
  if (isFd) {
    const fdInfo = buildFiscalDriveCommissionInfo(item);
    if (!fdInfo) return null;
    if (fdInfo.PINFL) return { kind: 'PINFL', value: fdInfo.PINFL };
    if (fdInfo.TIN) return { kind: 'TIN', value: fdInfo.TIN };
    return null;
  }

  // MULTIKASSA: only what went into commitent_tin
  const mkTin = resolveMultikassaCommitentTin(item);
  return parseCommittentIdentifier(mkTin);
}

/**
 * Formats committent receipt label and value in Uzbek ("Komitent (STIR): ..." / "Komitent (JShShIR): ...").
 * @param {object | null | undefined} item
 * @param {{ committentTin?: string, committentPinfl?: string }} [labels]
 * @param {'MULTIKASSA' | 'FISCAL_DRIVE'} [provider]
 * @returns {{ kind: 'TIN' | 'PINFL', label: string, value: string, text: string } | null}
 */
export function formatItemCommittentReceiptLine(item, labels = {}, provider) {
  const resolved = provider
    ? resolveProviderItemCommittent(item, provider)
    : resolveItemCommittent(item);
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
 * Attaches committent TIN/PINFL onto `sale.items` on the frontend
 * STRICTLY aligning with what was sent to the active fiscal provider payload.
 *
 * - If provider is Multikassa and cartItem only has NEW commissionPinfl:
 *   nothing is sent to Multikassa payload, so no committent row is attached to saleItem.
 * - If provider is FiscalDrive and cartItem has commissionPinfl (14 digits):
 *   PINFL is sent to FiscalDrive CommissionInfo, so PINFL committent row is attached to saleItem.
 *
 * @param {object | null | undefined} sale
 * @param {Array<object>} [cartItems]
 * @param {{ fiscalProvider?: string, capabilities?: object }} [options]
 * @returns {object | null | undefined}
 */
export function withSaleCommittentDetails(sale, cartItems = [], options = {}) {
  if (!sale || typeof sale !== 'object' || !Array.isArray(sale.items)) {
    return sale;
  }

  const provider = resolveSaleFiscalProvider(sale, options);
  const usedIndices = new Set();

  const nextItems = sale.items.map((saleItem, index) => {
    const matchedCart = findMatchingCartItem(saleItem, cartItems, index, usedIndices);
    const sourceItem = matchedCart || saleItem;
    const resolved = resolveProviderItemCommittent(sourceItem, provider);

    if (!resolved) {
      // Do not attach fake or un-fiscalized committent info
      return {
        ...saleItem,
        commissionTin: null,
        commissionPinfl: null,
        commitentTin: null,
      };
    }

    return {
      ...saleItem,
      commissionTin: resolved.kind === 'TIN' ? resolved.value : null,
      commissionPinfl: resolved.kind === 'PINFL' ? resolved.value : null,
      commitentTin: resolved.value,
    };
  });

  return {
    ...sale,
    fiscalProvider: provider,
    items: nextItems,
  };
}
