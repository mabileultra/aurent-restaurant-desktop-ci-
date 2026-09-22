import { round2 } from '../../../utils/taxAmounts';

function parseMoney(raw) {
  if (raw == null || raw === '') return 0;
  const n = Number(String(raw).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? round2(n) : 0;
}

/** Derive cash/card/change amounts for restaurant pay dialog. */
export function deriveRestaurantPay(totalDue, { method, tendered, cashPart }) {
  const due = round2(totalDue);
  const tenderedNum = parseMoney(tendered);
  const cashPartNum = parseMoney(cashPart);

  if (method === 'CARD') {
    return {
      due,
      cashAmount: 0,
      cardAmount: due,
      amountTendered: due,
      changeGiven: 0,
      canSubmit: due > 0,
      hintKey: null,
    };
  }

  if (method === 'MIXED') {
    const cash = cashPartNum > 0 ? cashPartNum : 0;
    const card = round2(Math.max(0, due - cash));
    const valid = cash > 0 && cash < due && round2(cash + card) === due;
    return {
      due,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: cash,
      changeGiven: 0,
      canSubmit: valid,
      hintKey: cash <= 0
        ? 'pos.mixedCashRequired'
        : cash >= due
          ? 'pos.mixedCashExceeds'
          : null,
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
  };
}

export function buildRestaurantPayPayload(derived, method) {
  return {
    method,
    amount: derived.due,
    cashAmount: derived.cashAmount,
    cardAmount: derived.cardAmount,
    amountTendered: derived.amountTendered,
    changeGiven: derived.changeGiven,
  };
}

export { parseMoney };
