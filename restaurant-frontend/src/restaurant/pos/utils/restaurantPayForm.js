import { round2 } from '../../../utils/taxAmounts';

function parseMoney(raw) {
  if (raw == null || raw === '') return 0;
  const n = Number(String(raw).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? round2(n) : 0;
}

/** Derive cash/card/change amounts for restaurant pay dialog. */
export function deriveRestaurantPay(totalDue, { method, tendered, cashPart, cardType }) {
  const due = round2(totalDue);
  const tenderedNum = parseMoney(tendered);
  const cashPartNum = parseMoney(cashPart);
  const needsCardType = method === 'CARD' || method === 'MIXED';
  const cardOk = !needsCardType || Boolean(cardType);

  if (method === 'CARD') {
    return {
      due,
      cashAmount: 0,
      cardAmount: due,
      amountTendered: due,
      changeGiven: 0,
      canSubmit: due > 0 && cardOk,
      hintKey: cardOk ? null : 'pos.cardTypeRequired',
      infoKey: null,
    };
  }

  if (method === 'CREDIT' || method === 'ADVANCE') {
    return {
      due,
      cashAmount: 0,
      cardAmount: 0,
      amountTendered: due,
      changeGiven: 0,
      canSubmit: due > 0,
      hintKey: null,
      infoKey: method === 'CREDIT' ? 'rst.order.payCreditHint' : 'rst.order.payAdvanceHint',
    };
  }

  if (method === 'MIXED') {
    const cash = cashPartNum > 0 ? cashPartNum : 0;
    const card = round2(Math.max(0, due - cash));
    const valid = cash > 0 && cash < due && round2(cash + card) === due && cardOk;
    return {
      due,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: cash,
      changeGiven: 0,
      canSubmit: valid,
      hintKey: !cardOk
        ? 'pos.cardTypeRequired'
        : cash <= 0
          ? 'pos.mixedCashRequired'
          : cash >= due
            ? 'pos.mixedCashExceeds'
            : null,
      infoKey: null,
    };
  }

  const amountTendered = tenderedNum > 0 ? tenderedNum : due;
  const changeGiven = round2(Math.max(0, amountTendered - due));
  return {
    due,
    cashAmount: due,
    cardAmount: 0,
    amountTendered,
    changeGiven,
    canSubmit: due > 0 && amountTendered >= due,
    hintKey: tenderedNum > 0 && tenderedNum < due ? 'rst.order.cashShort' : null,
    infoKey: null,
  };
}

export function buildRestaurantPayPayload(derived, method, cardType = null) {
  const payload = {
    method,
    amount: derived.due,
    cashAmount: derived.cashAmount,
    cardAmount: derived.cardAmount,
    amountTendered: derived.amountTendered,
    changeGiven: derived.changeGiven,
  };
  if ((method === 'CARD' || method === 'MIXED') && cardType) {
    payload.cardType = cardType;
  }
  return payload;
}

export function isNonFiscalPayMethod(method) {
  const m = String(method || '').toUpperCase();
  return m === 'CREDIT' || m === 'ADVANCE';
}

export { parseMoney };
