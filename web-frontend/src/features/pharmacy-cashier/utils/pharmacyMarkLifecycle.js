import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { isPharmacyMarkingCode } from './pharmacyMarkingCode';
import {
  cartHasMark,
  markingIdentityKey,
  markingIdentityKeys,
} from './pharmacyMarkIdentity';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

function pendingHasMark(pendingKeys, rawMark) {
  const keys = markingIdentityKeys(rawMark);
  return keys.some((k) => pendingKeys.includes(k));
}

/**
 * Жизненный цикл одного КМ до попадания в чек.
 *
 * duplicate  — уже в чеке / в pending
 * sold       — ASL: уже выведен из оборота
 * empty      — пустой код
 * not-marking— не DataMatrix
 * ok         — можно добавлять (новая пачка того же товара тоже ok)
 */
export function assessPharmacyMarkLifecycle({
  rawCode,
  cartItems = [],
  pendingKeys = [],
  aslResult = null,
}) {
  if (!String(rawCode || '').trim()) return { status: 'empty' };
  if (!isPharmacyMarkingCode(rawCode)) return { status: 'not-marking' };

  const mark = preserveMarkingCodeForFiscal(rawCode);
  const key = markingIdentityKey(mark);
  if (!key) return { status: 'empty' };

  if (pendingHasMark(pendingKeys, mark) || cartHasMark(cartItems, mark)) {
    return { status: 'duplicate', key, mark };
  }

  if (aslResult && isAslMarkAlreadySold(aslResult)) {
    return { status: 'sold', key, mark };
  }

  return { status: 'ok', key, mark };
}
