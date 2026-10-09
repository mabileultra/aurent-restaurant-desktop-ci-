import { extractVatFromInclusive, round2 } from '../../../utils/taxAmounts';
import { resolveRestaurantPayTotal } from './restaurantPayAmount';

function vatPercent(item) {
  const rate = Number(item?.taxRate);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return rate;
}

function isBillable(item) {
  return item && String(item.itemStatus || '').toUpperCase() !== 'CANCELLED';
}

function lineTotalOf(item) {
  const stored = Number(item.lineTotal);
  if (Number.isFinite(stored) && stored >= 0) return round2(stored);
  return round2((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0));
}

/** Строки заказа → cart-like для Multikassa. Процент обслуживания в налог не входит. */
export function orderToMultikassaCartItems(order) {
  const lines = (order?.items ?? []).filter(isBillable).map((item) => ({
    productId: item.menuItemId || item.id,
    name: item.name || 'Блюдо',
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    taxRate: vatPercent(item),
    unitOfMeasure: item.unitOfMeasure || 'шт',
    ikpu: item.ikpu || '',
    packageCode: item.packageCode || '',
    unitMeasureCode: item.unitMeasureCode || '',
    barcode: item.barcode || '',
    sku: item.sku || '',
    markedProduct: Boolean(item.markedProduct),
  }));

  const discount = round2(Math.max(0, Number(order?.discountAmount) || 0));
  if (discount > 0) {
    lines.push({
      productId: `rst-discount-${order?.id || 'x'}`,
      name: 'Скидка',
      quantity: 1,
      unitPrice: -discount,
      taxRate: 0,
      unitOfMeasure: 'шт',
    });
  }

  return lines;
}

export function restaurantPayTotal(order, commissionPreview = null) {
  return resolveRestaurantPayTotal(order, commissionPreview);
}

function serviceAmountOf(order) {
  return round2(Number(order?.serviceAmount ?? order?.commissionAmount) || 0);
}

/** Сумма и оплата для ОФД: блюда и скидка, без процента обслуживания. */
export function fiscalPaymentWithoutService(order, payAmount, payment) {
  const service = serviceAmountOf(order);
  const paid = round2(Number(payAmount) || 0);
  const fiscalTotal = round2(Math.max(0, paid - service));
  if (!(service > 0)) return { total: paid, payment };
  const method = String(payment?.paymentMethod || 'CASH').toUpperCase();
  let cash = round2(Number(payment?.cashAmount) || 0);
  let card = round2(Number(payment?.cardAmount) || 0);
  if (method === 'CARD' || method === 'CASHLESS') {
    cash = 0;
    card = fiscalTotal;
  } else if (method === 'MIXED') {
    let left = service;
    const fromCash = Math.min(Math.max(cash, 0), left);
    cash = round2(cash - fromCash);
    left = round2(left - fromCash);
    card = round2(Math.max(0, card - left));
  } else {
    cash = fiscalTotal;
    card = 0;
  }
  return {
    total: fiscalTotal,
    payment: {
      ...payment,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: fiscalTotal,
      changeGiven: 0,
    },
  };
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
  cardType = null,
  fiscal = null,
  cashierName,
  waiterName,
  storeName,
  storeId,
  customerLabel,
}) {
  const cartLines = orderToMultikassaCartItems(order);
  const items = cartLines.map((line, idx) => {
    const orderItem = (order?.items ?? []).filter(isBillable)[idx];
    const lineTotal = round2(line.unitPrice * line.quantity);
    const taxRatePercent = line.taxRate ?? 0;
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
      ikpu: line.ikpu || null,
      packageCode: line.packageCode || null,
      productSku: line.sku || null,
      // Service + discount cart rows are not FloorOrderItem rows — never refundable.
      isServiceLine: String(line.productId || '').startsWith('rst-'),
    };
  });

  const dishesSubtotal = round2(
    (order?.items ?? []).filter(isBillable).reduce((acc, item) => acc + lineTotalOf(item), 0),
  );
  const serviceAmount = serviceAmountOf(order);
  const discountTotal = round2(Math.max(0, Number(order?.discountAmount) || 0));
  const totalAmount = round2(Math.max(0, dishesSubtotal - discountTotal));
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
  if (serviceAmount > 0) {
    const fiscalPay = fiscalPaymentWithoutService(order, paid, {
      paymentMethod: method,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: tendered,
      changeGiven: change,
    });
    cash = fiscalPay.payment.cashAmount;
    card = fiscalPay.payment.cardAmount;
    tendered = fiscalPay.payment.amountTendered;
    change = fiscalPay.payment.changeGiven;
  }

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
    discountTotal,
    lineDiscountTotal: 0,
    orderDiscountAmount: discountTotal,
    orderDiscountPercent: 0,
    totalAmount,
    returnAmount: 0,
    paymentMethod: method,
    cardType: cardType || null,
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
    printFiscalQr: fiscal?.fiscalStatus === 'FISCALIZED',
  };
}
