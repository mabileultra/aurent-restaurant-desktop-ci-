import { extractVatFromInclusive, round2 } from '../../../utils/taxAmounts';
import { resolveRestaurantPayTotal } from './restaurantPayAmount';

const DEFAULT_VAT = 12;

function isBillable(item) {
  return item && String(item.itemStatus || '').toUpperCase() !== 'CANCELLED';
}

function lineTotalOf(item) {
  const stored = Number(item.lineTotal);
  if (Number.isFinite(stored) && stored >= 0) return round2(stored);
  return round2((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0));
}

/** Строки заказа → cart-like для Multikassa. */
export function orderToMultikassaCartItems(order, { serviceLabel } = {}) {
  const lines = (order?.items ?? []).filter(isBillable).map((item) => ({
    productId: item.menuItemId || item.id,
    name: item.name || 'Блюдо',
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    taxRate: DEFAULT_VAT,
    unitOfMeasure: 'шт',
  }));

  const serviceAmount = round2(Number(order?.commissionAmount) || 0);
  if (serviceAmount > 0) {
    const percent = Number(order?.commissionPercent);
    const label =
      serviceLabel ||
      (Number.isFinite(percent) && percent > 0
        ? `Обслуживание ${percent}%`
        : 'Обслуживание');
    lines.push({
      productId: `rst-service-${order?.id || 'x'}`,
      name: label,
      quantity: 1,
      unitPrice: serviceAmount,
      taxRate: DEFAULT_VAT,
      unitOfMeasure: 'шт',
    });
  }

  return lines;
}

export function restaurantPayTotal(order, commissionPreview = null) {
  return resolveRestaurantPayTotal(order, commissionPreview);
}

/**
 * OrderResponse + оплата + fiscal → объект как SaleResponse для FiscalReceiptBody / ESC/POS.
 */
export function buildRestaurantFiscalSale({
  order,
  paymentMethod,
  amount,
  cashAmount,
  cardAmount,
  amountTendered,
  changeGiven,
  fiscal = null,
  cashierName,
  waiterName,
  storeName,
  storeId,
  serviceLabel,
  customerLabel,
}) {
  const cartLines = orderToMultikassaCartItems(order, { serviceLabel });
  const items = cartLines.map((line, idx) => {
    const orderItem = (order?.items ?? []).filter(isBillable)[idx];
    const lineTotal = round2(line.unitPrice * line.quantity);
    const taxRatePercent = line.taxRate ?? DEFAULT_VAT;
    const returnedQuantity = Number(orderItem?.returnedQuantity) || 0;
    return {
      id: orderItem?.id || `${order?.id || 'rst'}-${idx}`,
      productName: line.name,
      saleType: 'PIECE',
      unitOfMeasure: line.unitOfMeasure || 'шт',
      quantity: line.quantity,
      returnedQuantity,
      returnableQuantity: Math.max(0, (Number(line.quantity) || 0) - returnedQuantity),
      unitPrice: line.unitPrice,
      lineTotal,
      taxAmount: extractVatFromInclusive(lineTotal, taxRatePercent),
      lineDiscount: 0,
      taxRatePercent,
      ikpu: null,
      productSku: null,
      isServiceLine: String(line.productId || '').startsWith('rst-service-'),
    };
  });

  const dishesSubtotal = round2(
    (order?.items ?? []).filter(isBillable).reduce((acc, item) => acc + lineTotalOf(item), 0),
  );
  const serviceAmount = round2(Number(order?.commissionAmount) || 0);
  const totalAmount = restaurantPayTotal(order);
  const taxTotal = round2(
    items.reduce((acc, item) => acc + (Number(item.taxAmount) || 0), 0),
  );
  const paid = round2(Number(amount) || totalAmount);
  const method = String(paymentMethod || 'CASH').toUpperCase();
  const receiptNumber =
    order?.storeId != null && order?.orderNo != null
      ? `RST-${order.storeId}-${order.orderNo}`
      : `RST-${order?.id || Date.now()}`;

  const employeeParts = [cashierName].filter(Boolean);
  if (waiterName) employeeParts.push(waiterName);

  let cash = cashAmount != null ? round2(cashAmount) : null;
  let card = cardAmount != null ? round2(cardAmount) : null;
  let tendered = amountTendered != null ? round2(amountTendered) : null;
  let change = changeGiven != null ? round2(changeGiven) : null;
  if (cash == null && card == null) {
    if (method === 'CARD') {
      cash = 0;
      card = paid;
    } else if (method === 'MIXED') {
      cash = 0;
      card = paid;
    } else {
      cash = paid;
      card = 0;
    }
  }
  if (tendered == null) tendered = method === 'CASH' ? paid : (cash ?? paid);
  if (change == null) change = method === 'CASH' ? round2(Math.max(0, tendered - paid)) : 0;

  return {
    id: order?.id,
    receiptNumber,
    cashierName: employeeParts.join(' · ') || '—',
    storeId: storeId ?? order?.storeId ?? null,
    storeName: storeName || null,
    customerName: customerLabel || null,
    createdAt: order?.closedAt || new Date().toISOString(),
    items,
    subtotal: dishesSubtotal,
    taxTotal,
    discountTotal: 0,
    lineDiscountTotal: 0,
    orderDiscountAmount: 0,
    orderDiscountPercent: 0,
    totalAmount,
    returnAmount: 0,
    paymentMethod: method,
    cardType: null,
    cashAmount: cash ?? 0,
    cardAmount: card ?? 0,
    receiptType: 'SALE',
    amountTendered: tendered ?? paid,
    changeGiven: change ?? 0,
    status: order?.status === 'REFUNDED' ? 'REFUNDED' : 'COMPLETED',
    notes: null,
    fiscalStatus: fiscal?.fiscalStatus || null,
    fiscalSign: fiscal?.fiscalSign || null,
    fiscalReceiptSeq: fiscal?.fiscalReceiptSeq || null,
    multikassaSaleId: fiscal?.multikassaSaleId || null,
    fiscalQrUrl: fiscal?.fiscalQrUrl || null,
    fiscalizedAt: fiscal?.fiscalStatus === 'FISCALIZED' ? new Date().toISOString() : null,
    fiscalTerminalId: fiscal?.fiscalTerminalId || fiscal?.terminalId || null,
    serviceAmount,
    printFiscalQr: true,
  };
}
