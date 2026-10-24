import { attachMarkToProduct } from './attachMarkToProduct';
import { inspectMarkPunched } from './inspectMarkPunched';
import { isMarkingCode } from './markingCode';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Скан КМ на кассе (grocery и pharmacy).
 *
 * 1. Sold-gate (кэш → склад → журнал → ASL, если ключ сохранён).
 * 2. Товар только по GTIN из КМ (`findProduct`). ASL карточку не ищет.
 * 3. В чек кладём полный КМ.
 */
export async function resolveCashierMarking({
  rawCode,
  storeId,
  aslEnabled = false,
  findProduct,
}) {
  const mark = preserveMarkingCodeForFiscal(rawCode);
  if (!mark || !isMarkingCode(rawCode)) {
    return { status: 'not-marking', mark: '', product: null, aslResult: null, aslError: null };
  }

  const gate = await inspectMarkPunched({
    storeId,
    mark,
    aslEnabled: Boolean(aslEnabled),
  });
  if (gate.punched) {
    return {
      status: 'sold',
      mark,
      product: null,
      aslResult: gate.aslResult,
      aslError: null,
    };
  }

  const product = findProduct ? await findProduct(mark, gate) : null;
  if (!product) {
    return {
      status: 'not-found',
      mark,
      product: null,
      aslResult: gate.aslResult,
      aslError: gate.aslError || null,
    };
  }

  return {
    status: 'ok',
    mark,
    product: attachMarkToProduct(product, mark),
    aslResult: gate.aslResult,
    aslError: null,
  };
}
