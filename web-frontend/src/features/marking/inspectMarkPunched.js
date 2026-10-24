import { pharmacyIntegrationApi } from '../../api/pharmacyIntegration.api';
import { pharmacySalesApi } from '../../api/pharmacySales.api';
import { pharmacyStockMarksApi } from '../../api/pharmacyStockMarks.api';
import { saleApi } from '../../api/sale.api';
import { isAslMarkAlreadySold } from './aslMarkAlreadySold';
import { isMarkSoldLocally, rememberSoldMarks, collectMarksFromCartItems } from './soldMarksStore';

function soldHit(status, extra = {}) {
  return {
    punched: true,
    aslResult: { found: true, alreadySold: true, status },
    stock: extra.stock ?? null,
    aslError: null,
  };
}

/**
 * Жёсткая проверка одного КМ до чека.
 * Склад IN_STOCK и карточка в каталоге не отменяют проверку:
 * локальный кэш → stock_marks → grocery-журнал → pharmacy-журнал → ASL (если включён).
 */
export async function inspectMarkPunched({ storeId, mark, aslEnabled = false }) {
  if (storeId && isMarkSoldLocally(storeId, mark)) {
    return soldHit('SOLD_LOCAL');
  }

  let stock = null;
  if (storeId) {
    try {
      const { data } = await pharmacyStockMarksApi.check({ storeId, code: mark });
      stock = data || null;
      if (data?.alreadySold) {
        rememberSoldMarks(storeId, [mark]);
        return soldHit(data.status || 'SOLD', { stock });
      }
    } catch {
      // склад недоступен — журнал продаж и ASL всё равно проверяем
    }
  }

  if (storeId) {
    try {
      const { data } = await saleApi.checkMarkSold({ storeId, code: mark });
      if (data?.sold === true) {
        rememberSoldMarks(storeId, [mark]);
        return soldHit(data.status || 'SOLD', { stock });
      }
    } catch {
      // grocery-журнал недоступен — проверяем аптечный и ASL
    }
  }

  if (storeId) {
    try {
      const { data } = await pharmacySalesApi.checkMarkSold({ storeId, code: mark });
      if (data?.sold === true) {
        rememberSoldMarks(storeId, [mark]);
        return soldHit(data.status || 'SOLD', { stock });
      }
    } catch {
      // сеть — ниже ещё ASL, если включён
    }
  }

  let aslResult = null;
  let aslError = null;
  if (aslEnabled && storeId) {
    try {
      const { data } = await pharmacyIntegrationApi.verifyMarking({ storeId, code: mark });
      aslResult = data;
      if (isAslMarkAlreadySold(aslResult)) {
        rememberSoldMarks(storeId, [mark]);
        return {
          punched: true,
          aslResult,
          stock,
          aslError: null,
        };
      }
    } catch (error) {
      aslError = error;
    }
  }

  return { punched: false, aslResult, stock, aslError };
}

/** До фискального чека: уже пробитый КМ сюда не проходит. */
export async function assertCartMarksNotPunched(storeId, items) {
  const marks = collectMarksFromCartItems(items);
  for (const mark of marks) {
    const gate = await inspectMarkPunched({ storeId, mark, aslEnabled: false });
    if (gate.punched) {
      const err = new Error('Эта маркировка уже пробита в нашей продаже');
      err.code = 'MARK_ALREADY_SOLD';
      throw err;
    }
  }
}
