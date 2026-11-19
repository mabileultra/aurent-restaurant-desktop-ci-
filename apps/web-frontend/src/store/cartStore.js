// src/store/cartStore.js
import { create } from 'zustand';
import { round2 } from '../utils/taxAmounts';
import {
  FORBIDDEN_MXIK_REASON_CODE,
  isForbiddenMxik,
  normalizeMxik,
  normalizePrescriptionNumber,
} from '@aurent/shared-fiscal';
import {
  buildCheckoutLineItems,
  calculateCartTotals,
  capOrderDiscount,
  lineDiscountAmount,
  lineGross,
  lineSubtotal,
} from './cartCalculations';
import {
  clearActiveCartFields,
  executeHoldCart,
  executeRestoreParkedCart,
  MAX_PARKED_CARTS,
} from './cartParkedOperations';
import {
  addPieceItemToCart,
  addWeightLineToCart,
  insertSeparatePieceItemToCart,
  patchCartLineInCart,
  removeItemFromCart,
  updateDiscountPercentInCart,
  updateQuantityInCart,
} from './cartItemOperations';

export {
  buildCheckoutLineItems,
  lineDiscountAmount,
  lineGross,
  lineSubtotal,
  MAX_PARKED_CARTS,
};

function assertProductMxikAllowed(product) {
  const raw = product?.ikpu ?? product?.mxik;
  if (!isForbiddenMxik(raw)) return;
  const err = new Error(`FORBIDDEN_MXIK:${normalizeMxik(raw)}`);
  err.code = FORBIDDEN_MXIK_REASON_CODE;
  err.mxik = normalizeMxik(raw);
  throw err;
}

export const useCartStore = create((set, get) => ({
  items: [],
  orderDiscountAmount: 0,
  parkedCarts: [],
  customerId: null,
  customerName: null,
  checkNo: null,
  prescriptionNumber: '',

  setPrescriptionNumber: (num) => set({ prescriptionNumber: normalizePrescriptionNumber(num) }),
  clearPrescriptionNumber: () => set({ prescriptionNumber: '' }),

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

  setCustomer: (id, name) => set({ customerId: id ?? null, customerName: name ? String(name) : null }),
  clearCustomer: () => set({ customerId: null, customerName: null }),

  addPieceItem: (product, qty = 1) => {
    assertProductMxikAllowed(product);
    get().ensureCheckNo();
    const result = addPieceItemToCart(get().items, product, qty, get().orderDiscountAmount);
    set({ items: result.items, orderDiscountAmount: result.orderDiscountAmount });
    return result.lineId;
  },

  insertSeparatePieceItem: (product, qty = 1) => {
    assertProductMxikAllowed(product);
    get().ensureCheckNo();
    const result = insertSeparatePieceItemToCart(get().items, product, qty, get().orderDiscountAmount);
    set({ items: result.items, orderDiscountAmount: result.orderDiscountAmount });
    return result.lineId;
  },

  patchCartLine: (lineId, patch) => set(patchCartLineInCart(get().items, lineId, patch, get().orderDiscountAmount)),

  addWeightLine: (product, quantityKg) => {
    assertProductMxikAllowed(product);
    get().ensureCheckNo();
    const result = addWeightLineToCart(get().items, product, quantityKg, get().orderDiscountAmount);
    set({ items: result.items, orderDiscountAmount: result.orderDiscountAmount });
    return result.lineId;
  },

  addItem: (product, qty = 1) =>
    product.saleType === 'WEIGHT' ? get().addWeightLine(product, qty) : get().addPieceItem(product, qty),

  updateQuantity: (lineId, qty) => set(updateQuantityInCart(get().items, lineId, qty, get().orderDiscountAmount)),
  patchLine: (lineId, patch) => get().patchCartLine(lineId, patch),
  updateUnitPrice: (lineId, price) => get().patchLine(lineId, { unitPrice: Math.max(0, round2(price)) }),
  updateDiscountPercent: (lineId, pct) =>
    set(updateDiscountPercentInCart(get().items, lineId, pct, get().orderDiscountAmount)),
  removeItem: (lineId) => set(removeItemFromCart(get().items, lineId, get().orderDiscountAmount)),

  clearCart: () => set({ ...clearActiveCartFields }),
  holdCart: () => executeHoldCart(get(), set, get),
  restoreParkedCart: (id) => executeRestoreParkedCart(id, get(), set),
  removeParkedCart: (id) => set({ parkedCarts: get().parkedCarts.filter((p) => p.id !== id) }),
  clearParkedCarts: () => set({ parkedCarts: [] }),

  getLinesTotal: () => calculateCartTotals(get().items, get().orderDiscountAmount).linesTotal,
  getOrderDiscount: () => calculateCartTotals(get().items, get().orderDiscountAmount).orderDiscount,
  setOrderDiscountAmount: (amt) => set({ orderDiscountAmount: capOrderDiscount(get().items, amt) }),
  setOrderDiscountPercent: (pct) => {
    const p = Math.max(0, Math.min(100, round2(pct)));
    const linesTotal = get().getLinesTotal();
    set({ orderDiscountAmount: capOrderDiscount(get().items, round2(linesTotal * (p / 100))) });
  },
  clearOrderDiscount: () => set({ orderDiscountAmount: 0 }),

  getCheckoutLineItems: () => buildCheckoutLineItems(get().items),
  getCheckoutOrderDiscountAmount: () => get().getOrderDiscount(),
  getCheckoutOrderDiscountPercent: () => {
    const linesTotal = get().getLinesTotal();
    const orderDisc = get().getOrderDiscount();
    return orderDisc > 0 && linesTotal > 0 ? round2((orderDisc / linesTotal) * 100) : 0;
  },

  getSubtotal: () => calculateCartTotals(get().items, get().orderDiscountAmount).subtotal,
  getTaxTotal: () => calculateCartTotals(get().items, get().orderDiscountAmount).taxTotal,
  getLineDiscountTotal: () => calculateCartTotals(get().items, get().orderDiscountAmount).lineDiscountTotal,
  getDiscountTotal: () => calculateCartTotals(get().items, get().orderDiscountAmount).discountTotal,
  getTotal: () => calculateCartTotals(get().items, get().orderDiscountAmount).total,
}));
