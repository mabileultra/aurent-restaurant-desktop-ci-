/**
 * Суммы оплаты для печати чека.
 * cashAmount в API — доля выручки (для CASH = total), amountTendered — сколько дали.
 * На чеке в «Наличные» показываем полученное, иначе сдача выглядит сломанной.
 */
export function resolveReceiptPaymentAmounts(sale) {
  const method = String(sale?.paymentMethod || 'CASH').toUpperCase();
  const total = Number(sale?.totalAmount) || 0;
  const cashExplicit = Number(sale?.cashAmount);
  const cardExplicit = Number(sale?.cardAmount);
  const tendered = Number(sale?.amountTendered);
  const changeStored = Number(sale?.changeGiven);
  const hasCash = Number.isFinite(cashExplicit) && cashExplicit > 0;
  const hasCard = Number.isFinite(cardExplicit) && cardExplicit > 0;
  const change =
    Number.isFinite(changeStored) && changeStored > 0 ? changeStored : 0;

  if (method === 'CASH' && !hasCard) {
    const received =
      Number.isFinite(tendered) && tendered > 0
        ? tendered
        : hasCash
          ? cashExplicit
          : total;
    const computedChange = Math.max(0, Math.round((received - total) * 100) / 100);
    return {
      cashAmt: received,
      cardAmt: 0,
      paidTotal: total,
      change: change || computedChange,
      method,
    };
  }

  if (hasCash || hasCard) {
    const cashAmt = hasCash ? cashExplicit : 0;
    const cardAmt = hasCard ? cardExplicit : 0;
    return {
      cashAmt,
      cardAmt,
      paidTotal: cashAmt + cardAmt || total,
      change,
      method,
    };
  }

  if (method === 'CARD' || method === 'CASHLESS' || method === 'MPESA') {
    return {
      cashAmt: 0,
      cardAmt: Number.isFinite(tendered) && tendered > 0 ? tendered : total,
      paidTotal: total,
      change: 0,
      method,
    };
  }

  return {
    cashAmt: 0,
    cardAmt: 0,
    paidTotal: total,
    change,
    method,
  };
}
