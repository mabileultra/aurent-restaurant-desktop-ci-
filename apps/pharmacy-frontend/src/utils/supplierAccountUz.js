/** Узбекский ҳисоб рақам (расчётный счёт): ровно 20 цифр. */

const ACCOUNT_LEN = 20;

export function digitsAccount(value) {
  return String(value || '').replace(/\D/g, '').slice(0, ACCOUNT_LEN);
}

/** Группы 4×5 для удобного ввода: 2020 8000 1234 5678 9012 */
export function formatSupplierAccount(value) {
  const d = digitsAccount(value);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function isCompleteSupplierAccount(value) {
  return digitsAccount(value).length === ACCOUNT_LEN;
}
