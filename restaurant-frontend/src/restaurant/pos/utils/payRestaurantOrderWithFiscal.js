import { rstOrderApi } from '../../api/order.api';
import {
  fiscalizeSaleBeforeCommit,
  loadMultikassaCapabilities,
  resolveMultikassaFiscalErrorMessage,
  wrapMultikassaFiscalError,
} from '../../../services/multikassa';
import { FISCAL_STATUS } from '../../../services/multikassa/multikassaConstants';
import {
  buildRestaurantFiscalSale,
  orderToMultikassaCartItems,
  restaurantPayTotal,
} from './buildRestaurantFiscalSale';
import { toPayAmountPayload } from './restaurantPayAmount';
import { isNonFiscalPayMethod } from './restaurantPayForm';
import { round2 } from '../../../utils/taxAmounts';

function pendingFiscalFromError(err) {
  return {
    fiscalStatus: FISCAL_STATUS.PENDING,
    fiscalSign: null,
    fiscalReceiptSeq: null,
    multikassaSaleId: null,
    fiscalQrUrl: null,
    fiscalTerminalId: null,
    fiscalError: err?.message || 'Pending fiscal sync',
    multikassaRetryBody: null,
    clientOperationId: null,
  };
}

/**
 * Оплата заказа с Multikassa.
 * - requireBeforeSale: фискал → pay (жёсткий OFD-режим).
 * - иначе: pay → фискал (не оставляем «чек есть, оплаты нет»; при сбое фискала продажа остаётся).
 */
export async function payRestaurantOrderWithFiscal({
  order,
  method,
  amount,
  cashAmount,
  cardAmount,
  amountTendered,
  changeGiven,
  cardType = null,
  debtPhone = null,
  debtComment = null,
  advancePaid = null,
  storeId,
  storeName,
  shiftId = null,
  cashRegisterId = null,
  cashierName,
  waiterName,
  customerLabel,
  serviceLabel,
  t,
}) {
  const total = restaurantPayTotal(order);
  const payAmount = toPayAmountPayload(amount != null ? Number(amount) : total);
  const payMethod = String(method || 'CASH').toUpperCase();

  let cash = cashAmount != null ? round2(cashAmount) : null;
  let card = cardAmount != null ? round2(cardAmount) : null;
  let tendered = amountTendered != null ? round2(amountTendered) : null;
  let change = changeGiven != null ? round2(changeGiven) : null;

  if (payMethod === 'CASH') {
    cash = payAmount;
    card = 0;
    tendered = tendered != null && tendered >= payAmount ? tendered : payAmount;
    change = round2(Math.max(0, tendered - payAmount));
  } else if (payMethod === 'CARD') {
    cash = 0;
    card = payAmount;
    tendered = payAmount;
    change = 0;
  } else if (payMethod === 'MIXED') {
    cash = cash != null ? cash : 0;
    card = card != null ? card : round2(Math.max(0, payAmount - cash));
    tendered = tendered != null ? tendered : cash;
    change = change != null ? change : round2(Math.max(0, tendered - cash));
  } else if (isNonFiscalPayMethod(payMethod)) {
    cash = 0;
    card = 0;
    tendered = payAmount;
    change = 0;
  }

  const skipFiscal = isNonFiscalPayMethod(payMethod);

  const payment = {
    paymentMethod: payMethod,
    receiptType: 'SALE',
    cashAmount: cash,
    cardAmount: card,
    amountTendered: tendered,
    changeGiven: change,
  };

  const cartItems = orderToMultikassaCartItems(order, { serviceLabel });
  const capabilities = skipFiscal
    ? { enabled: false }
    : await loadMultikassaCapabilities(storeId, cashRegisterId);
  const requireBeforeSale = Boolean(capabilities?.enabled && capabilities?.requireBeforeSale);

  const fiscalArgs = {
    capabilities,
    cartItems,
    payment,
    total: payAmount,
    shiftId,
    cashierName: cashierName || 'CASHIER',
    contractorName: storeName,
    offline: false,
    clientSaleId: order?.id ? `rst-${order.id}` : null,
  };

  let fiscalPayload = null;

  if (requireBeforeSale) {
    try {
      fiscalPayload = await fiscalizeSaleBeforeCommit(fiscalArgs);
    } catch (err) {
      const wrapped = wrapMultikassaFiscalError(err);
      wrapped.message = resolveMultikassaFiscalErrorMessage(wrapped, t) || wrapped.message;
      throw wrapped;
    }
  }

  let paidOrder;
  try {
    const res = await rstOrderApi.pay(order.id, {
      method: payMethod,
      amount: payAmount,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: tendered,
      changeGiven: change,
      ...(cardType ? { cardType } : {}),
      ...(skipFiscal ? { debtPhone, debtComment, advancePaid } : {}),
    });
    paidOrder = res.data;
  } catch (payErr) {
    if (fiscalPayload && fiscalPayload.fiscalStatus === FISCAL_STATUS.FISCALIZED) {
      payErr.fiscalOrphan = fiscalPayload;
      payErr.message = [
        payErr.message || 'Оплата не прошла',
        t?.('rst.order.fiscalOrphanHint', {
          defaultValue: 'Фискальный чек уже пробит — сверьте с OFD и повторите оплату или оформите возврат.',
        }),
      ].filter(Boolean).join('. ');
    }
    throw payErr;
  }

  if (!requireBeforeSale && capabilities?.enabled) {
    try {
      fiscalPayload = await fiscalizeSaleBeforeCommit(fiscalArgs);
    } catch (err) {
      const wrapped = wrapMultikassaFiscalError(err);
      fiscalPayload = pendingFiscalFromError({
        message: resolveMultikassaFiscalErrorMessage(wrapped, t) || wrapped.message,
      });
    }
  }

  const sale = buildRestaurantFiscalSale({
    order: {
      ...paidOrder,
      commissionAmount: paidOrder.commissionAmount ?? order.commissionAmount,
      commissionPercent: paidOrder.commissionPercent ?? order.commissionPercent,
      items: paidOrder.items?.length ? paidOrder.items : order.items,
    },
    paymentMethod: payMethod,
    amount: payAmount,
    cashAmount: cash,
    cardAmount: card,
    amountTendered: tendered,
    changeGiven: change,
    cardType,
    fiscal: fiscalPayload,
    cashierName,
    waiterName,
    storeName,
    storeId,
    serviceLabel,
    customerLabel,
  });

  return { order: paidOrder, sale, fiscal: fiscalPayload };
}
