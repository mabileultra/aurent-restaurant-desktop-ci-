/** CASH / CARD / TRANSFER — оплаченные части; DEBT — остаток или 100% в долг. */

export const PAID_METHODS = ['CASH', 'CARD', 'TRANSFER'];

export function emptyPaymentForm(paymentType = 'CASH') {
  const type = paymentType === 'CREDIT' ? 'DEBT' : (paymentType || 'CASH');
  return {
    mode: 'single',
    paymentType: type,
    amounts: { CASH: '', CARD: '', TRANSFER: '' },
  };
}

export function paymentFormFromReceipt(receipt) {
  const payments = Array.isArray(receipt?.payments) ? receipt.payments : [];
  if (payments.length > 0) {
    const amounts = { CASH: '', CARD: '', TRANSFER: '' };
    payments.forEach((row) => {
      if (row?.method && amounts[row.method] !== undefined && row.amount != null) {
        amounts[row.method] = String(row.amount);
      }
    });
    return {
      mode: 'split',
      paymentType: receipt?.paymentType || 'CASH',
      amounts,
    };
  }
  return emptyPaymentForm(receipt?.paymentType);
}

export function paidSum(amounts) {
  return PAID_METHODS.reduce((sum, method) => {
    const n = Number(amounts?.[method]);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

export function debtRemainder(totalCost, amounts) {
  const total = Number(totalCost);
  if (!Number.isFinite(total) || total <= 0) return 0;
  const rem = total - paidSum(amounts);
  return rem > 0 ? rem : 0;
}

/** Payload для API: либо paymentType, либо payments[]. */
export function buildPaymentPayload(form) {
  if (form.mode === 'split') {
    const payments = PAID_METHODS
      .map((method) => {
        const n = Number(form.amounts?.[method]);
        if (!Number.isFinite(n) || n <= 0) return null;
        return { method, amount: n };
      })
      .filter(Boolean);
    if (payments.length === 0) {
      return { paymentType: 'DEBT', payments: undefined };
    }
    return { paymentType: undefined, payments };
  }
  return { paymentType: form.paymentType || 'CASH', payments: undefined };
}
