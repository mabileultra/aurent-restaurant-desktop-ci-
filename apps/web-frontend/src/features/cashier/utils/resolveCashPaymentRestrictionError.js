/** reasonCode из context ответа API (AUR-13). */
const REASON_I18N = {
  CASH_PAYMENT_CATEGORY_FORBIDDEN: 'pos.cashPaymentCategoryForbidden',
  CASH_PAYMENT_VEHICLE_AGE_FORBIDDEN: 'pos.cashPaymentVehicleAgeForbidden',
  CASH_PAYMENT_AMOUNT_LIMIT: 'pos.cashPaymentAmountLimit',
};

/**
 * @param {unknown} error
 * @param {Function} t
 * @returns {string|null}
 */
export function resolveCashPaymentRestrictionError(error, t) {
  const data = error?.response?.data;
  const reasonCode = data?.context?.reasonCode || error?.context?.reasonCode || error?.reasonCode;
  const key = reasonCode ? REASON_I18N[reasonCode] : null;
  if (key) {
    const limit = data?.context?.cashPaymentLimitSoum;
    return t(key, {
      limit,
      defaultValue: data?.message || error?.message || reasonCode,
    });
  }
  const message = data?.message || error?.message;
  if (typeof message === 'string' && /наличн/i.test(message) && /запрещ|превыш/i.test(message)) {
    return message;
  }
  return null;
}
