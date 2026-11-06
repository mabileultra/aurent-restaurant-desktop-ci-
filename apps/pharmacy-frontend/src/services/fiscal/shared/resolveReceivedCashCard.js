import { round2 } from '../../../utils/taxAmounts';

/** Сколько из суммы чека пришло наличными и сколько безналом (в сумах). */
export function resolveReceivedCashCard(payment, total) {
  const method = String(payment?.paymentMethod || 'CASH').toUpperCase();
  const due = round2(total);
  let cash = Number(payment?.cashAmount);
  let card = Number(payment?.cardAmount);
  if (!Number.isFinite(cash) || cash < 0) cash = 0;
  if (!Number.isFinite(card) || card < 0) card = 0;

  if (method === 'CASH') {
    if (cash <= 0 && card <= 0) cash = due;
  } else if (method === 'CARD' || method === 'CASHLESS' || method === 'MPESA') {
    if (cash <= 0 && card <= 0) card = due;
  } else if (method === 'MIXED') {
    if (cash > 0 && card <= 0) card = round2(Math.max(0, due - cash));
    else if (card > 0 && cash <= 0) cash = round2(Math.max(0, due - card));
  }

  return { cash: round2(cash), card: round2(card) };
}
