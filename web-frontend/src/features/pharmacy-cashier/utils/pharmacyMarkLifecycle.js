import { isAslMarkAlreadySold } from './aslMarkingAlreadySold';
import { isPharmacyMarkingCode } from './pharmacyMarkingCode';
import {
  cartHasMark,
  markingIdentityKey,
} from './pharmacyMarkIdentity';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Жизненный цикл одного КМ до попадания в чек.
 *
 * duplicate  — уже в чеке / в pending
 * sold       — ASL: уже выведен из оборота
 * empty      — пустой код
 * not-marking— не DataMatrix
 * ok         — можно добавлять (новый или ещё одна пачка)
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

  if (pendingKeys.includes(key) || cartHasMark(cartItems, mark)) {
    return { status: 'duplicate', key, mark };
  }

  if (aslResult && isAslMarkAlreadySold(aslResult)) {
    return { status: 'sold', key, mark };
  }

  return { status: 'ok', key, mark };
}
