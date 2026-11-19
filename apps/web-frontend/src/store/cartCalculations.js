import { lineRequiresPrescription } from '@aurent/shared-fiscal';
import { extractVatFromInclusive, netFromInclusive, round2 } from '../utils/taxAmounts';
import { roundQty } from '../utils/quantityFormat';
import { unitLabel } from '../utils/unitConfig';

export const newLineId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const lineGross = (item) => round2(item.unitPrice * item.quantity);

export const lineDiscountAmount = (item) => {
  if (item.discount != null && item.discount > 0) {
    return round2(Math.min(item.discount, lineGross(item)));
  }
  const pct = Number(item.discountPercent) || 0;
  return round2(lineGross(item) * (pct / 100));
};

export const lineSubtotal = (item) => round2(lineGross(item) - lineDiscountAmount(item));

export const capOrderDiscount = (items, orderDiscountAmount) => {
  const linesTotal = round2(items.reduce((acc, item) => acc + lineSubtotal(item), 0));
  return round2(Math.min(Math.max(0, orderDiscountAmount), linesTotal));
};

export const buildLine = (product, quantity) => {
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
    commissionPinfl: product.commissionPinfl ?? null,
    markedProduct: product.markedProduct === true,
    productMark: product.productMark ?? product.markCode ?? null,
    productMarks: Array.isArray(product.productMarks) ? [...product.productMarks] : null,
    attributes: product.attributes ?? null,
    requiresPrescription: lineRequiresPrescription(product),
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
    sellAsBlock: product.sellAsBlock === true,
    unitsInPack: product.unitsInPack ?? null,
    packUnitPrice: product.packUnitPrice ?? null,
    pieceStep: product.pieceStep ?? null,
  };
};

export const syncDiscountFromPercent = (item) => ({
  ...item,
  discount: lineDiscountAmount({ ...item, discount: 0 }),
});

export function buildCheckoutLineItems(items) {
  return items.map((i) => {
    const marks = Array.isArray(i.productMarks) && i.productMarks.some(Boolean)
      ? i.productMarks.filter(Boolean)
      : [i.productMark || i.markCode].filter(Boolean);
    return {
      productId: i.productId,
      quantity: roundQty(i.quantity),
      discount: lineDiscountAmount(i),
      unitPrice: round2(i.unitPrice),
      ...(marks.length > 0 ? { productMarks: marks } : {}),
    };
  });
}

export const calculateCartTotals = (items, orderDiscountAmount) => {
  const linesTotal = round2(items.reduce((acc, item) => acc + lineSubtotal(item), 0));
  const orderDiscount = capOrderDiscount(items, orderDiscountAmount);
  const lineDiscountTotal = round2(items.reduce((acc, item) => acc + lineDiscountAmount(item), 0));
  const subtotal = items.reduce((acc, item) => acc + netFromInclusive(lineSubtotal(item), item.taxRate), 0);
  const taxTotal = items.reduce((acc, item) => acc + extractVatFromInclusive(lineSubtotal(item), item.taxRate), 0);
  return {
    linesTotal,
    orderDiscount,
    lineDiscountTotal,
    discountTotal: round2(lineDiscountTotal + orderDiscount),
    subtotal,
    taxTotal,
    total: round2(linesTotal - orderDiscount),
  };
};
