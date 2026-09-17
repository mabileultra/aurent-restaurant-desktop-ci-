import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { markingMatchesProduct } from './pharmacyMarkingProductMatch';
import { isPharmacyMarkingCode, normalizePharmacyMarkingCode } from './pharmacyMarkingCode';
import { lineMarkKeys } from './pharmacyMarkedScanCart';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

export function shortMarkLabel(mark) {
  const code = normalizePharmacyMarkingCode(mark);
  if (!code) return '';
  if (code.length <= 16) return code;
  return `…${code.slice(-10)}`;
}

/**
 * Решение по одному скану в модалке количества.
 * Количество растёт только на status === 'accepted'.
 * Товар уже выбран — GTIN из КМ важнее, чем «не найден» от ASL.
 */
export function assessQtyMarkingScan({
  product,
  rawCode,
  scans = [],
  cartItems = [],
  stockPacks = 0,
  extraGtins = [],
  aslResult = null,
}) {
  if (!isPharmacyMarkingCode(rawCode)) return { status: 'not-marking' };

  const mark = preserveMarkingCodeForFiscal(rawCode);
  const key = normalizePharmacyMarkingCode(mark);
  if (!key) return { status: 'not-marking' };

  const known = scans.some((scan) => scan.key === key)
    || cartItems.some((line) => lineMarkKeys(line).includes(key));
  if (known) return { status: 'duplicate', key };

  if (aslResult && isAslMarkAlreadySold(aslResult)) return { status: 'sold', key };

  // ASL явно сказал, что GTIN другой — не подменяем товар
  if (aslResult?.found && aslResult.gtin && !markingMatchesProduct(product, '', [aslResult.gtin])) {
    return { status: 'mismatch', key };
  }

  const gtins = [...extraGtins];
  if (aslResult?.gtin) gtins.push(aslResult.gtin);
  const matches = markingMatchesProduct(product, rawCode, gtins);

  if (!matches) {
    if (aslResult && aslResult.found === false) return { status: 'not-found', key };
    return { status: 'mismatch', key };
  }

  const stock = Number(stockPacks) || 0;
  const alreadyInCart = cartItems
    .filter((line) => line.productId === product?.id)
    .reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  if (stock > 0 && alreadyInCart + scans.length + 1 > stock) return { status: 'stock', key };

  return {
    status: 'accepted',
    key,
    mark,
    label: shortMarkLabel(mark),
    aslStatus: aslResult?.status || (aslResult?.found === false ? 'LOCAL' : ''),
  };
}
