import { CARD_CATEGORY } from '@aurent/shared-types';
import {
  isValidRrn,
  isValidSocialCardInput,
  maskSocialCardNumber,
  normalizeCardCategory,
  normalizeRrn,
} from '@aurent/shared-fiscal';
import { round2 } from '../../../utils/taxAmounts';

function parseMoney(raw) {
  if (raw == null || raw === '') return 0;
  const n = Number(String(raw).replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? round2(n) : 0;
}

function validateCardDetails({ cardCategory, rrn, socialCardInput }) {
  const category = normalizeCardCategory(cardCategory) || CARD_CATEGORY.PERSONAL;
  const normalizedRrn = normalizeRrn(rrn);
  if (!isValidRrn(normalizedRrn)) {
    return { valid: false, hintKey: 'pos.cardRrnRequired', details: null };
  }
  let maskedSocial = null;
  if (category === CARD_CATEGORY.SOCIAL) {
    if (!isValidSocialCardInput(socialCardInput)) {
      return { valid: false, hintKey: 'pos.socialCardRequired', details: null };
    }
    maskedSocial = maskSocialCardNumber(socialCardInput);
  }
  return {
    valid: true,
    hintKey: null,
    details: {
      cardCategory: category,
      rrn: normalizedRrn,
      socialCardNumber: maskedSocial,
    },
  };
}

/** Derive cash/card/change amounts for restaurant pay dialog. */
export function deriveRestaurantPay(totalDue, {
  method,
  tendered,
  cashPart,
  cardType,
  cardCategory = CARD_CATEGORY.PERSONAL,
  rrn = '',
  socialCardInput = '',
  debtPhone = '',
}) {
  const due = round2(totalDue);
  const tenderedNum = parseMoney(tendered);
  const cashPartNum = parseMoney(cashPart);
  const needsCardType = method === 'CARD' || method === 'MIXED';
  const cardOk = !needsCardType || Boolean(cardType);
  const cardCheck = needsCardType && cardOk
    ? validateCardDetails({ cardCategory, rrn, socialCardInput })
    : { valid: true, hintKey: null, details: null };

  if (method === 'CARD' || method === 'CASHLESS') {
    const canSubmit = due > 0 && (method === 'CASHLESS' || (cardOk && cardCheck.valid));
    const hintKey = method === 'CASHLESS'
      ? null
      : !cardOk
        ? 'pos.cardTypeRequired'
        : cardCheck.hintKey;
    return {
      due,
      cashAmount: 0,
      cardAmount: due,
      amountTendered: due,
      changeGiven: 0,
      cardDetails: method === 'CARD' ? cardCheck.details : null,
      canSubmit,
      hintKey,
      infoKey: method === 'CASHLESS' ? 'rst.order.payCashlessHint' : null,
    };
  }

  if (method === 'CREDIT' || method === 'ADVANCE') {
    const phoneOk = String(debtPhone || '').trim().length > 0;
    const advancePaid = method === 'ADVANCE' ? tenderedNum : null;
    const advanceOk = method !== 'ADVANCE' || (tenderedNum > 0 && tenderedNum <= due);
    return {
      due,
      cashAmount: 0,
      cardAmount: 0,
      amountTendered: due,
      changeGiven: 0,
      advancePaid,
      debtRemaining: method === 'ADVANCE' ? round2(Math.max(0, due - tenderedNum)) : due,
      canSubmit: due > 0 && phoneOk && advanceOk,
      hintKey: !phoneOk
        ? 'rst.order.debtPhoneRequired'
        : method === 'ADVANCE' && tenderedNum <= 0
          ? 'rst.order.advanceRequired'
          : method === 'ADVANCE' && tenderedNum > due
            ? 'rst.order.advanceExceeds'
            : null,
      infoKey: method === 'CREDIT' ? 'rst.order.payCreditHint' : 'rst.order.payAdvanceHint',
    };
  }

  if (method === 'MIXED') {
    const cash = cashPartNum > 0 ? cashPartNum : 0;
    const card = round2(Math.max(0, due - cash));
    const valid = cash > 0 && cash < due && round2(cash + card) === due && cardOk && cardCheck.valid;
    return {
      due,
      cashAmount: cash,
      cardAmount: card,
      amountTendered: cash,
      changeGiven: 0,
      cardDetails: cardCheck.details,
      canSubmit: valid,
      hintKey: !cardOk
        ? 'pos.cardTypeRequired'
        : cardCheck.hintKey
          ? cardCheck.hintKey
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

export function buildRestaurantPayPayload(derived, method, cardType = null, debt = null) {
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
    if (derived.cardDetails) {
      payload.cardCategory = derived.cardDetails.cardCategory;
      payload.rrn = derived.cardDetails.rrn;
      if (derived.cardDetails.socialCardNumber) {
        payload.socialCardNumber = derived.cardDetails.socialCardNumber;
      }
    }
  }
  if (isNonFiscalPayMethod(method)) {
    payload.debtPhone = String(debt?.phone || '').trim();
    payload.debtComment = String(debt?.comment || '').trim() || null;
    if (method === 'ADVANCE') payload.advancePaid = derived.advancePaid;
  }
  return payload;
}

export function isNonFiscalPayMethod(method) {
  const m = String(method || '').toUpperCase();
  return m === 'CREDIT' || m === 'ADVANCE';
}

export { parseMoney };
