import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { markingMatchesProduct } from './pharmacyMarkingProductMatch';
import {
  extractGtinFromMarkingCode,
  isPharmacyMarkingCode,
  normalizePharmacyMarkingCode,
} from './pharmacyMarkingCode';
import { markingIdentityKey, lineMarkIdentityKeys } from './pharmacyMarkIdentity';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

export function shortMarkLabel(mark) {
  const code = normalizePharmacyMarkingCode(mark);
  if (!code) return '';
  if (code.length <= 16) return code;
  return `…${code.slice(-10)}`;
}

/**
 * Решение по одному скану (тесты / внутренняя логика).
 * На кассе жизненный цикл: assessPharmacyMarkLifecycle + planMarkedScan.
 */
export function assessQtyMarkingScan({
  product,
  rawCode,
  scans = [],
  cartItems = [],
  stockPacks = 0,
  extraGtins = [],
  aslResult = null,
  pendingKeys = [],
}) {
  if (!isPharmacyMarkingCode(rawCode)) return { status: 'not-marking' };

  const mark = preserveMarkingCodeForFiscal(rawCode);
  const key = markingIdentityKey(mark);
  if (!key) return { status: 'not-marking' };

  const known = scans.some((scan) => scan.key === key)
    || pendingKeys.includes(key)
    || cartItems.some((line) => lineMarkIdentityKeys(line).includes(key));
  if (known) return { status: 'duplicate', key };

  if (aslResult && isAslMarkAlreadySold(aslResult)) {
    return { status: 'sold', key };
  }

  const aslGtin = aslResult?.found && aslResult.gtin ? String(aslResult.gtin) : null;
  if (aslGtin && !markingMatchesProduct(product, '', [aslGtin])) {
    return { status: 'mismatch', key };
  }

  const gtins = [...extraGtins];
  if (aslGtin) gtins.push(aslGtin);

  const localMatch = markingMatchesProduct(product, rawCode, gtins);
  if (localMatch) {
    const stock = Number(stockPacks) || 0;
    const alreadyInCart = cartItems
      .filter((line) => line.productId === product?.id)
      .reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    if (stock > 0 && alreadyInCart + scans.length + 1 > stock) {
      return { status: 'stock', key };
    }
    return {
      status: 'accepted',
      key,
      mark,
      label: shortMarkLabel(mark),
      aslStatus: aslResult?.status || '',
    };
  }

  const codeGtin = extractGtinFromMarkingCode(rawCode);
  if (codeGtin || aslGtin) {
    return { status: 'mismatch', key };
  }

  return { status: 'mismatch', key };
}

export function previewQtyMarkingScan(args) {
  return assessQtyMarkingScan({ ...args, aslResult: null });
}
