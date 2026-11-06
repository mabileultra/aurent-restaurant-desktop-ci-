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

function hasIkpu(item) {
  return String(item?.ikpu || '').trim() !== '';
}

/** Только блюда с ИКПУ → Multikassa. Без ИКПУ, % и скидка в ОФД не уходят. */
export function orderToMultikassaCartItems(order) {
  return (order?.items ?? [])
    .filter(isBillable)
    .filter(hasIkpu)
    .map((item) => ({
      productId: item.menuItemId || item.id,
      name: item.name || 'Блюдо',
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      taxRate: vatPercent(item),
      unitOfMeasure: item.unitOfMeasure || 'шт',
      ikpu: String(item.ikpu).trim(),
      packageCode: item.packageCode || '',
      unitMeasureCode: item.unitMeasureCode || '',
      barcode: item.barcode || '',
      sku: item.sku || '',
      markedProduct: Boolean(item.markedProduct),
    }));
}

export function restaurantPayTotal(order, commissionPreview = null) {
  return resolveRestaurantPayTotal(order, commissionPreview);
}

function serviceAmountOf(order) {
  return round2(Number(order?.serviceAmount ?? order?.commissionAmount) || 0);
}

export function fiscalCartTotal(cartItems) {
  return round2(
    (cartItems || []).reduce(
      (sum, line) => sum + round2((Number(line.unitPrice) || 0) * (Number(line.quantity) || 0)),
      0,
    ),
  );
}

/** Оплата в ОФД = сумма строк с ИКПУ (не весь чек зала). */
export function fiscalPaymentForCart(cartItems, payment) {
  const fiscalTotal = Math.max(0, fiscalCartTotal(cartItems));
  const method = String(payment?.paymentMethod || 'CASH').toUpperCase();
  let cash = 0;
  let card = 0;
  if (method === 'CARD' || method === 'CASHLESS') {
    card = fiscalTotal;
  } else if (method === 'MIXED') {
    const payCash = round2(Number(payment?.cashAmount) || 0);
    const payCard = round2(Number(payment?.cardAmount) || 0);
    const paySum = round2(payCash + payCard);
    if (paySum > 0 && fiscalTotal > 0) {
      cash = round2(Math.min(fiscalTotal, (payCash / paySum) * fiscalTotal));
      card = round2(Math.max(0, fiscalTotal - cash));
    } else {
      card = fiscalTotal;
    }
  } else {
    cash = fiscalTotal;
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

/** @deprecated use fiscalPaymentForCart */
export function fiscalPaymentWithoutService(order, payAmount, payment) {
  return fiscalPaymentForCart(orderToMultikassaCartItems(order), payment);
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
  const billable = (order?.items ?? []).filter(isBillable);
  const fiscalCart = orderToMultikassaCartItems(order);
  const fiscalized = Boolean(
    fiscal?.fiscalStatus === 'FISCALIZED'
      || fiscal?.fiscalSign
      || fiscal?.fiscalQrUrl
      || fiscal?.multikassaSaleId,
  );
  // Налоговый чек — только строки с ИКПУ; обычный просмотр — все блюда.
  const sourceLines = fiscalized
    ? fiscalCart
    : billable.map((item) => ({
      productId: item.menuItemId || item.id,
      name: item.name || 'Блюдо',
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      taxRate: vatPercent(item),
      unitOfMeasure: item.unitOfMeasure || 'шт',
      ikpu: item.ikpu || '',
      packageCode: item.packageCode || '',
      sku: item.sku || '',
    }));

  const items = sourceLines.map((line, idx) => {
    const orderItem = billable.find(
      (item) => String(item.menuItemId || item.id) === String(line.productId)
        || String(item.id) === String(line.productId),
    );
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
      isServiceLine: String(line.productId || '').startsWith('rst-'),
    };
  });

  const dishesSubtotal = round2(billable.reduce((acc, item) => acc + lineTotalOf(item), 0));
  const serviceAmount = serviceAmountOf(order);
  const discountTotal = round2(Math.max(0, Number(order?.discountAmount) || 0));
  const fiscalTotal = fiscalCartTotal(fiscalCart);
  const totalAmount = fiscalized
    ? fiscalTotal
    : round2(Math.max(0, dishesSubtotal - discountTotal));
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
    if (method === 'CARD' || method === 'CASHLESS') {
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
  if (fiscalized && fiscalCart.length > 0) {
    const fiscalPay = fiscalPaymentForCart(fiscalCart, {
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
