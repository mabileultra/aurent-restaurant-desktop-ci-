import { pharmacySalesApi } from '../../api/pharmacySales.api';
import { pharmacyStockMarksApi } from '../../api/pharmacyStockMarks.api';
import { saleApi } from '../../api/sale.api';
import {
  collectMarksFromCartItems,
  forgetSoldMarks,
  isMarkSoldLocally,
  rememberSoldMarks,
} from './soldMarksStore';

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
 * локальный кэш → stock_marks → grocery-журнал → pharmacy-журнал.
 * ASL не вызываем: оборот проверяет Tasnif, вывод — ОФД.
 */
export async function inspectMarkPunched({ storeId, mark }) {
  if (storeId && isMarkSoldLocally(storeId, mark)) {
    try {
      const { data } = await saleApi.checkMarkSold({ storeId, code: mark });
      if (data?.sold === true) {
        return soldHit(data.status || 'SOLD_LOCAL');
      }
      forgetSoldMarks(storeId, [mark]);
    } catch {
      return soldHit('SOLD_LOCAL');
    }
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
      // склад недоступен — журнал продаж всё равно проверяем
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
      // grocery-журнал недоступен — проверяем аптечный
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
      // сеть — журнал недоступен, Tasnif проверит оборот на скане
    }
  }

  return { punched: false, aslResult: null, stock, aslError: null };
}

/** До фискального чека: уже пробитый КМ сюда не проходит. */
export async function assertCartMarksNotPunched(storeId, items) {
  const marks = collectMarksFromCartItems(items);
  for (const mark of marks) {
    const gate = await inspectMarkPunched({ storeId, mark });
    if (gate.punched) {
      const err = new Error('Эта маркировка уже пробита в нашей продаже');
      err.code = 'MARK_ALREADY_SOLD';
      throw err;
    }
  }
}
