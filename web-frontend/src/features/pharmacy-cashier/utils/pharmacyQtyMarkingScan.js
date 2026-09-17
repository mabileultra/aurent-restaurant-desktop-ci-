import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { markingMatchesProduct } from './pharmacyMarkingProductMatch';
import {
  extractGtinFromMarkingCode,
  isPharmacyMarkingCode,
  markingScanKey,
  normalizePharmacyMarkingCode,
} from './pharmacyMarkingCode';
import { lineMarkKeys } from './pharmacyMarkedScanCart';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

export function shortMarkLabel(mark) {
  const code = normalizePharmacyMarkingCode(mark);
  if (!code) return '';
  if (code.length <= 16) return code;
  return `…${code.slice(-10)}`;
}

/**
 * Надёжная проверка КМ в модалке «Добавить в чек».
 *
 * Порядок (намеренно жёсткий):
 * 1) это DataMatrix / КМ, не обычный штрихкод
 * 2) повтор / уже в чеке
 * 3) ASL: уже выведен из оборота → sold
 * 4) ASL нашёл чужой GTIN → mismatch
 * 5) GTIN из КМ совпал со штрихкодом выбранного товара → accepted
 *    (даже если ASL сказал found:false / сеть упала / aslResult=null)
 * 6) иначе mismatch (в модалке товар уже выбран — «не найден» здесь не используем)
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
  const key = markingScanKey(mark);
  if (!key) return { status: 'not-marking' };

  const known = scans.some((scan) => scan.key === key)
    || pendingKeys.includes(key)
    || cartItems.some((line) => lineMarkKeys(line).includes(key));
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
    return accept(key, mark, aslResult);
  }

  // GTIN из КМ есть, но не совпал с выбранным товаром — другой препарат.
  const codeGtin = extractGtinFromMarkingCode(rawCode);
  if (codeGtin || aslGtin) {
    return { status: 'mismatch', key };
  }

  // КМ без читаемого GTIN и ASL не помог — не «не найден», а «не тот код / другой товар».
  return { status: 'mismatch', key };
}

function accept(key, mark, aslResult) {
  return {
    status: 'accepted',
    key,
    mark,
    label: shortMarkLabel(mark),
    aslStatus: aslResult?.status || '',
  };
}

/**
 * Локальная проверка до ASL: если GTIN уже совпал с товаром — можно принимать,
 * ASL потом только на sold / чужой GTIN.
 */
export function previewQtyMarkingScan(args) {
  return assessQtyMarkingScan({ ...args, aslResult: null });
}
