import { isAslMarkAlreadySold } from './aslMarkAlreadySold';
import { isMarkingCode } from './markingCode';
import {
  cartHasMark,
  markingIdentityKey,
  markingIdentityKeys,
} from './markingIdentity';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

function pendingHasMark(pendingKeys, rawMark) {
  const keys = markingIdentityKeys(rawMark);
  return keys.some((k) => pendingKeys.includes(k));
}

/**
 * Жизненный цикл одного КМ до попадания в чек.
 *
 * duplicate  — уже в чеке / в pending
 * sold       — уже продана (ASL / локально после чека)
 * empty      — пустой код
 * not-marking— не DataMatrix
 * ok         — можно добавлять
 */
export function assessMarkLifecycle({
  rawCode,
  cartItems = [],
  pendingKeys = [],
  aslResult = null,
  storeId = null,
  locallySold = null,
}) {
  if (!String(rawCode || '').trim()) return { status: 'empty' };
  if (!isMarkingCode(rawCode)) return { status: 'not-marking' };

  const mark = preserveMarkingCodeForFiscal(rawCode);
  const key = markingIdentityKey(mark);
  if (!key) return { status: 'empty' };

  if (pendingHasMark(pendingKeys, mark) || cartHasMark(cartItems, mark)) {
    return { status: 'duplicate', key, mark };
  }

  if (locallySold === true) {
    return { status: 'sold', key, mark };
  }

  if (aslResult && isAslMarkAlreadySold(aslResult)) {
    return { status: 'sold', key, mark };
  }

  return { status: 'ok', key, mark };
}
