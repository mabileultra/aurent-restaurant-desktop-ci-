// src/store/cartStore.js
import { create } from 'zustand';
import { extractVatFromInclusive, netFromInclusive, round2 } from '../utils/taxAmounts';
import { isPieceLikeProduct, roundQty } from '../utils/quantityFormat';
import { unitLabel } from '../utils/unitConfig';

export const lineGross = (item) => round2(item.unitPrice * item.quantity);

export const lineDiscountAmount = (item) => {
  if (item.discount != null && item.discount > 0) {
    return round2(Math.min(item.discount, lineGross(item)));
  }
  const pct = Number(item.discountPercent) || 0;
  return round2(lineGross(item) * (pct / 100));
};

export const lineSubtotal = (item) => round2(lineGross(item) - lineDiscountAmount(item));

const capOrderDiscount = (items, orderDiscountAmount) => {
  const linesTotal = round2(items.reduce((acc, item) => acc + lineSubtotal(item), 0));
  return round2(Math.min(Math.max(0, orderDiscountAmount), linesTotal));
};

const newLineId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const MAX_PARKED_CARTS = 6;

const snapshotActiveCart = (state) => ({
  id: newLineId(),
  items: state.items.map((item) => ({ ...item })),
  orderDiscountAmount: state.orderDiscountAmount,
  customerId: state.customerId,
  customerName: state.customerName,
  checkNo: state.checkNo,
  parkedAt: Date.now(),
});

const clearActiveCartFields = {
  items: [],
  orderDiscountAmount: 0,
  customerId: null,
  customerName: null,
  checkNo: null,
};

const buildLine = (product, quantity) => {
  const saleType = product.saleType || 'PIECE';
  return {
    lineId: newLineId(),
    productId: product.id,
    name: product.name,
    sku: product.sku,
    ikpu: product.ikpu ?? null,
    barcode: product.barcode ?? null,
    packageCode: product.packageCode ?? null,
    unitMeasureCode: product.unitMeasureCode ?? null,
    commissionTin: product.commissionTin ?? null,
    markedProduct: product.markedProduct === true,
    productMark: product.productMark ?? product.markCode ?? null,
    attributes: product.attributes ?? null,
    saleType,
    unitCode: product.unitCode || (saleType === 'WEIGHT' ? 'KG' : 'PCS'),
    unitOfMeasure: product.unitOfMeasure ?? null,
    storageLocation: product.storageLocation ?? null,
    unitLabel: saleType === 'WEIGHT' ? unitLabel(product.unitCode || 'KG') : 'pcs',
    costPrice: Number(product.costPrice ?? 0),
    unitPrice: Number(product.sellingPrice),
    taxRate: Number(product.taxRate ?? 12),
    maxStock: Number(product.stockQuantity ?? 0),
    quantity: roundQty(quantity),
    discountPercent: Number(product.defaultDiscountPercent ?? 0),
    discount: 0,
    pharmacySellByPiece: product.pharmacySellByPiece === true,
    unitsInPack: product.unitsInPack ?? null,
    packUnitPrice: product.packUnitPrice ?? null,
    pieceStep: product.pieceStep ?? null,
  };
};

const syncDiscountFromPercent = (item) => ({
  ...item,
  discount: lineDiscountAmount({ ...item, discount: 0 }),
});

/** Позиции для API: только построчные скидки (скидка на чек — отдельными полями в sales). */
export function buildCheckoutLineItems(items) {
  return items.map((i) => ({
    productId: i.productId,
    quantity: roundQty(i.quantity),
    discount: lineDiscountAmount(i),
    unitPrice: round2(i.unitPrice),
  }));
}

export const useCartStore = create((set, get) => ({
  items: [],
  orderDiscountAmount: 0,
  /** Отложенные чеки (до MAX_PARKED_CARTS): [{ id, items, orderDiscountAmount, customerId, customerName, checkNo, parkedAt }] */
  parkedCarts: [],
  customerId: null,
  customerName: null,
  /** Локальный номер черновика чека (до продажи) */
  checkNo: null,

  ensureCheckNo: () => {
    if (get().checkNo) return get().checkNo;
    let seq = 1;
    try {
      seq = Number(localStorage.getItem('pos-draft-check-seq') || '0') + 1;
      localStorage.setItem('pos-draft-check-seq', String(seq));
    } catch {
      seq = Math.floor(Math.random() * 9000) + 1000;
    }
    const checkNo = String(seq).padStart(4, '0');
    set({ checkNo });
    return checkNo;
  },

  setCustomer: (customerId, customerName) =>
    set({
      customerId: customerId ?? null,
      customerName: customerName ? String(customerName) : null,
    }),

  clearCustomer: () => set({ customerId: null, customerName: null }),

  /** Штучный / услуга: +1, объединение строк по productId. */
  addPieceItem: (product, quantity = 1) => {
    get().ensureCheckNo();
    const qty = roundQty(quantity);
    const { items } = get();
    const existing = items.find(
      (i) =>
        i.productId === product.id
        && isPieceLikeProduct(i)
        && Boolean(i.pharmacySellByPiece) === Boolean(product.pharmacySellByPiece)
    );
    if (existing) {
      const next = syncDiscountFromPercent({
        ...existing,
        quantity: roundQty(existing.quantity + qty),
      });
      const nextItems = items.map((i) => (i.lineId === existing.lineId ? next : i));
      set({
        items: nextItems,
        orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
      });
      return next.lineId;
    }
    const line = syncDiscountFromPercent(buildLine(product, qty));
    const nextItems = [...items, line];
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
    return line.lineId;
  },

  /** Весовой: всегда отдельная строка. */
  addWeightLine: (product, quantityKg) => {
    get().ensureCheckNo();
    const line = syncDiscountFromPercent(buildLine(product, quantityKg));
    const nextItems = [...get().items, line];
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
    return line.lineId;
  },

  addItem: (product, quantity = 1) => {
    if (product.saleType === 'WEIGHT') {
      return get().addWeightLine(product, quantity);
    }
    return get().addPieceItem(product, quantity);
  },

  updateQuantity: (lineId, quantity) => {
    const q = roundQty(quantity);
    if (q <= 0) {
      get().removeItem(lineId);
      return;
    }
    const nextItems = get().items.map((i) => {
      if (i.lineId !== lineId) return i;
      const next = { ...i, quantity: q };
      if (isPieceLikeProduct(i)) {
        next.quantity = Math.max(1, Math.round(q));
      }
      return syncDiscountFromPercent(next);
    });
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  updateUnitPrice: (lineId, unitPrice) => {
    const price = Math.max(0, round2(unitPrice));
    const nextItems = get().items.map((i) =>
      i.lineId === lineId ? syncDiscountFromPercent({ ...i, unitPrice: price }) : i
    );
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  updateDiscountPercent: (lineId, discountPercent) => {
    const pct = Math.max(0, Math.min(100, round2(discountPercent)));
    const nextItems = get().items.map((i) =>
      i.lineId === lineId ? syncDiscountFromPercent({ ...i, discountPercent: pct }) : i
    );
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  removeItem: (lineId) => {
    const nextItems = get().items.filter((i) => i.lineId !== lineId);
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  clearCart: () =>
    set({
      items: [],
      orderDiscountAmount: 0,
      customerId: null,
      customerName: null,
      checkNo: null,
    }),

  /**
   * F6: отложить текущий чек; если корзина пуста и один отложенный — вернуть;
   * если несколько — 'choose' (открыть список в UI).
   * @returns {'held'|'restored'|'choose'|'full'|'empty'}
   */
  holdCart: () => {
    const state = get();
    if (state.items.length > 0) {
      if (state.parkedCarts.length >= MAX_PARKED_CARTS) return 'full';
      set({
        parkedCarts: [...state.parkedCarts, snapshotActiveCart(state)],
        ...clearActiveCartFields,
      });
      return 'held';
    }
    if (state.parkedCarts.length === 1) {
      get().restoreParkedCart(state.parkedCarts[0].id);
      return 'restored';
    }
    if (state.parkedCarts.length > 1) return 'choose';
    return 'empty';
  },

  restoreParkedCart: (parkedId) => {
    const state = get();
    const ticket = state.parkedCarts.find((p) => p.id === parkedId);
    if (!ticket) return 'missing';

    let nextParked = state.parkedCarts.filter((p) => p.id !== parkedId);
    if (state.items.length > 0) {
      if (nextParked.length >= MAX_PARKED_CARTS) return 'full';
      nextParked = [...nextParked, snapshotActiveCart(state)];
    }

    set({
      items: ticket.items,
      orderDiscountAmount: ticket.orderDiscountAmount ?? 0,
      customerId: ticket.customerId ?? null,
      customerName: ticket.customerName ?? null,
      checkNo: ticket.checkNo ?? null,
      parkedCarts: nextParked,
    });
    return 'restored';
  },

  removeParkedCart: (parkedId) => {
    set({
      parkedCarts: get().parkedCarts.filter((p) => p.id !== parkedId),
    });
  },

  clearParkedCarts: () => set({ parkedCarts: [] }),

  getLinesTotal: () =>
    round2(get().items.reduce((acc, item) => acc + lineSubtotal(item), 0)),

  getOrderDiscount: () => capOrderDiscount(get().items, get().orderDiscountAmount),

  setOrderDiscountAmount: (amount) => {
    set({ orderDiscountAmount: capOrderDiscount(get().items, amount) });
  },

  setOrderDiscountPercent: (discountPercent) => {
    const pct = Math.max(0, Math.min(100, round2(discountPercent)));
    const linesTotal = get().getLinesTotal();
    set({ orderDiscountAmount: capOrderDiscount(get().items, round2(linesTotal * (pct / 100))) });
  },

  clearOrderDiscount: () => set({ orderDiscountAmount: 0 }),

  getCheckoutLineItems: () => buildCheckoutLineItems(get().items),

  getCheckoutOrderDiscountAmount: () => get().getOrderDiscount(),

  getCheckoutOrderDiscountPercent: () => {
    const linesTotal = get().getLinesTotal();
    const orderDisc = get().getOrderDiscount();
    if (orderDisc <= 0 || linesTotal <= 0) return 0;
    return round2((orderDisc / linesTotal) * 100);
  },

  getSubtotal: () =>
    get().items.reduce(
      (acc, item) => acc + netFromInclusive(lineSubtotal(item), item.taxRate),
      0
    ),

  getTaxTotal: () =>
    get().items.reduce(
      (acc, item) => acc + extractVatFromInclusive(lineSubtotal(item), item.taxRate),
      0
    ),

  getLineDiscountTotal: () =>
    round2(get().items.reduce((acc, item) => acc + lineDiscountAmount(item), 0)),

  getDiscountTotal: () => round2(get().getLineDiscountTotal() + get().getOrderDiscount()),

  getTotal: () => round2(get().getLinesTotal() - get().getOrderDiscount()),
}));
