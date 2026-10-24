import { attachMarkToProduct } from './attachMarkToProduct';
import { inspectMarkCirculation } from './inspectMarkCirculation';
import { inspectMarkPunched } from './inspectMarkPunched';
import { lookupTasnifIdentity } from './lookupProductByMarkingGtin';
import { isMarkingCode } from './markingCode';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

function emptyResolve(status, mark, extras = {}) {
  return {
    status,
    mark,
    product: null,
    aslResult: extras.aslResult ?? null,
    aslError: extras.aslError ?? null,
    markingCode: extras.markingCode ?? null,
    message: extras.message ?? null,
  };
}

/**
 * Скан КМ: всегда Tasnif (оборот), товар — склад через Tasnif.
 * Локальный «пробит» не отменяет запрос в Tasnif.
 */
export async function resolveCashierMarking({
  rawCode,
  storeId,
  cashRegisterId = null,
  findProduct,
}) {
  const mark = preserveMarkingCodeForFiscal(rawCode);
  if (!mark || !isMarkingCode(rawCode)) {
    return emptyResolve('not-marking', '');
  }

  const gate = await inspectMarkPunched({ storeId, mark });
  const product = findProduct ? await findProduct(mark, gate) : null;
  const hasIkpu = /\d{8,}/.test(String(product?.ikpu || '').replace(/\D/g, ''));
  const circulationProduct = hasIkpu
    ? product
    : { ...(product || {}), ...(await lookupTasnifIdentity(mark) || {}) };

  const circulation = await inspectMarkCirculation({
    cashRegisterId,
    product: circulationProduct,
    mark,
  });
  if (circulation.status === 'not-in-circulation') {
    return emptyResolve('withdrawn', mark, {
      aslResult: gate.aslResult,
      markingCode: circulation.code,
      message: circulation.message,
    });
  }
  if (circulation.status === 'unavailable') {
    return emptyResolve('check-failed', mark, {
      aslResult: gate.aslResult,
      markingCode: circulation.code,
      message: circulation.message,
    });
  }

  if (!product) {
    return emptyResolve('not-found', mark, {
      aslResult: gate.aslResult,
      aslError: gate.aslError || null,
    });
  }

  if (gate.punched && circulation.status === 'skipped') {
    return emptyResolve('sold', mark, { aslResult: gate.aslResult });
  }

  return {
    status: 'ok',
    mark,
    product: attachMarkToProduct(product, mark),
    aslResult: gate.aslResult,
    aslError: null,
  };
}
