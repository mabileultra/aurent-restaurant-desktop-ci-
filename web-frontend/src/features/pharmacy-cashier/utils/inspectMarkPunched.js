import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { pharmacySalesApi } from '../../../api/pharmacySales.api';
import { pharmacyStockMarksApi } from '../../../api/pharmacyStockMarks.api';
import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { isPharmacyMarkSoldLocally, rememberPharmacySoldMarks, collectMarksFromCartItems } from './pharmacySoldMarksStore';

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
 * локальный кэш → stock_marks → sale_sold_marks → ASL (если включён).
 */
export async function inspectMarkPunched({ storeId, mark, aslEnabled = false }) {
  if (storeId && isPharmacyMarkSoldLocally(storeId, mark)) {
    return soldHit('SOLD_LOCAL');
  }

  let stock = null;
  if (storeId) {
    try {
      const { data } = await pharmacyStockMarksApi.check({ storeId, code: mark });
      stock = data || null;
      if (data?.alreadySold) {
        rememberPharmacySoldMarks(storeId, [mark]);
        return soldHit(data.status || 'SOLD', { stock });
      }
    } catch {
      // склад недоступен — журнал продаж и ASL всё равно проверяем
    }
  }

  if (storeId) {
    try {
      const { data } = await pharmacySalesApi.checkMarkSold({ storeId, code: mark });
      if (data?.sold === true) {
        rememberPharmacySoldMarks(storeId, [mark]);
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
        rememberPharmacySoldMarks(storeId, [mark]);
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
