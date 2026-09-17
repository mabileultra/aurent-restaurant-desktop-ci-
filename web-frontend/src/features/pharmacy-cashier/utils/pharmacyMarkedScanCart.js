import { useCartStore } from '../../../store/cartStore';
import {
  markingIdentityKey,
  markingIdentityKeys,
  lineMarkIdentityKeys,
  marksShareIdentity,
} from './pharmacyMarkIdentity';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

export function lineMarkKeys(line) {
  return lineMarkIdentityKeys(line);
}

export function isMarkCountedLine(line) {
  return lineMarkKeys(line).length > 0;
}

function productQty(items, productId) {
  return items
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + Number(line.quantity || 0), 0);
}

function markAlreadyInItems(items, rawMark) {
  const scanKeys = markingIdentityKeys(rawMark);
  if (scanKeys.length === 0) return false;
  return items.some((line) => {
    const lineKeys = lineMarkKeys(line);
    return scanKeys.some((k) => lineKeys.includes(k));
  });
}

/** Следующий чек после скана: новая маркировка +1, повтор — duplicate. */
export function planMarkedScan(items, product, rawMark) {
  const mark = preserveMarkingCodeForFiscal(rawMark);
  const key = markingIdentityKey(mark);
  if (!key) return { status: 'empty' };

  if (markAlreadyInItems(items, mark)) {
    return { status: 'duplicate', key, mark };
  }

  const stock = Number(product?.stockQuantity ?? product?.maxStock ?? 0);
  if (stock > 0 && productQty(items, product.id) + 1 > stock) {
    return { status: 'stock', key, mark };
  }

  const markedLine = items.find(
    (line) => line.productId === product.id && isMarkCountedLine(line),
  );
  if (!markedLine) {
    return { status: 'create', key, mark, quantity: 1 };
  }

  const productMarks = [...(markedLine.productMarks || []), mark];
  return {
    status: 'append',
    key,
    lineId: markedLine.lineId,
    mark,
    productMarks,
    quantity: productMarks.length,
  };
}

/** Снять одну маркировку с чека. */
export function removePharmacyMarking(rawMark) {
  const key = markingIdentityKey(preserveMarkingCodeForFiscal(rawMark));
  if (!key) return false;
  const items = useCartStore.getState().items;
  const line = items.find((item) => markAlreadyInItems([item], rawMark));
  if (!line) return false;
  const productMarks = (line.productMarks || []).filter(
    (mark) => !marksShareIdentity(mark, rawMark),
  );
  if (productMarks.length === 0) {
    useCartStore.getState().removeItem(line.lineId);
    return true;
  }
  useCartStore.getState().patchCartLine(line.lineId, {
    productMarks,
    productMark: productMarks[0],
    markCode: productMarks[0],
    quantity: productMarks.length,
    markedProduct: true,
  });
  return true;
}

export function applyPharmacyMarkingScan(product, rawMark) {
  const items = useCartStore.getState().items;
  const plan = planMarkedScan(items, product, rawMark);
  if (plan.status === 'create') {
    const lineId = useCartStore.getState().insertSeparatePieceItem(
      {
        ...product,
        markedProduct: true,
        productMark: plan.mark,
        markCode: plan.mark,
        productMarks: [plan.mark],
        pharmacySellByPiece: false,
      },
      1,
    );
    return { status: 'added', lineId, quantity: 1, key: plan.key, mark: plan.mark };
  }
  if (plan.status === 'append') {
    useCartStore.getState().patchCartLine(plan.lineId, {
      productMarks: plan.productMarks,
      productMark: plan.productMarks[0],
      markCode: plan.productMarks[0],
      quantity: plan.quantity,
      markedProduct: true,
    });
    return {
      status: 'added',
      lineId: plan.lineId,
      quantity: plan.quantity,
      key: plan.key,
      mark: plan.mark,
    };
  }
  return plan;
}
