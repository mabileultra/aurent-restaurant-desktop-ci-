import { useCartStore } from '../../../store/cartStore';
import { normalizePharmacyMarkingCode } from './pharmacyMarkingCode';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

export function lineMarkKeys(line) {
  const marks = Array.isArray(line?.productMarks) ? line.productMarks : [];
  return marks.map((mark) => normalizePharmacyMarkingCode(mark)).filter(Boolean);
}

export function isMarkCountedLine(line) {
  return lineMarkKeys(line).length > 0;
}

function productQty(items, productId) {
  return items
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + Number(line.quantity || 0), 0);
}

/** Следующий чек после скана: новая маркировка +1, без маркировки количество не трогаем. */
export function planMarkedScan(items, product, rawMark) {
  const mark = preserveMarkingCodeForFiscal(rawMark);
  const key = normalizePharmacyMarkingCode(mark);
  if (!key) return { status: 'empty' };

  const duplicate = items.some((line) => lineMarkKeys(line).includes(key));
  if (duplicate) return { status: 'duplicate' };

  const stock = Number(product?.stockQuantity ?? product?.maxStock ?? 0);
  if (stock > 0 && productQty(items, product.id) + 1 > stock) {
    return { status: 'stock' };
  }

  const markedLine = items.find(
    (line) => line.productId === product.id && isMarkCountedLine(line),
  );
  if (!markedLine) {
    return { status: 'create', mark, quantity: 1 };
  }

  const productMarks = [...(markedLine.productMarks || []), mark];
  return {
    status: 'append',
    lineId: markedLine.lineId,
    mark,
    productMarks,
    quantity: productMarks.length,
  };
}

/** Снять одну маркировку с чека. Строки без этого кода не трогаем. */
export function removePharmacyMarking(rawMark) {
  const key = normalizePharmacyMarkingCode(preserveMarkingCodeForFiscal(rawMark));
  if (!key) return false;
  const items = useCartStore.getState().items;
  const line = items.find((item) => lineMarkKeys(item).includes(key));
  if (!line) return false;
  const productMarks = (line.productMarks || []).filter(
    (mark) => normalizePharmacyMarkingCode(mark) !== key,
  );
  if (productMarks.length === 0) {
    useCartStore.getState().removeItem(line.lineId);
    return true;
  }
  useCartStore.getState().patchCartLine(line.lineId, {
    productMarks,
    productMark: productMarks[0],
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
    return { status: 'added', lineId, quantity: 1 };
  }
  if (plan.status === 'append') {
    useCartStore.getState().patchCartLine(plan.lineId, {
      productMarks: plan.productMarks,
      productMark: plan.productMarks[0],
      quantity: plan.quantity,
      markedProduct: true,
    });
    return { status: 'added', lineId: plan.lineId, quantity: plan.quantity };
  }
  return plan;
}
