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

async function softCheck(fn) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Жёсткая проверка одного КМ до чека.
 * Локальный кэш сначала; журналы склада/grocery/pharmacy — параллельно.
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

  if (!storeId) {
    return { punched: false, aslResult: null, stock: null, aslError: null };
  }

  const [stockData, groceryData, pharmacyData] = await Promise.all([
    softCheck(async () => {
      const { data } = await pharmacyStockMarksApi.check({ storeId, code: mark });
      return data || null;
    }),
    softCheck(async () => {
      const { data } = await saleApi.checkMarkSold({ storeId, code: mark });
      return data || null;
    }),
    softCheck(async () => {
      const { data } = await pharmacySalesApi.checkMarkSold({ storeId, code: mark });
      return data || null;
    }),
  ]);

  const stock = stockData;
  if (stockData?.alreadySold) {
    rememberSoldMarks(storeId, [mark]);
    return soldHit(stockData.status || 'SOLD', { stock });
  }
  if (groceryData?.sold === true) {
    rememberSoldMarks(storeId, [mark]);
    return soldHit(groceryData.status || 'SOLD', { stock });
  }
  if (pharmacyData?.sold === true) {
    rememberSoldMarks(storeId, [mark]);
    return soldHit(pharmacyData.status || 'SOLD', { stock });
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
