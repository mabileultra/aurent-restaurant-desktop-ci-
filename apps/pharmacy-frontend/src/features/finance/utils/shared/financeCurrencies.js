export const FINANCE_CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];

export const DEFAULT_FINANCE_CURRENCY = 'UZS';

export function buildFinanceCurrencyOptions(t) {
  return FINANCE_CURRENCIES.map((code) => ({
    value: code,
    label: t(`finance.currencies.${code}`, code),
  }));
}

export function accountCurrency(accounts, accountId) {
  const account = (accounts ?? []).find((a) => String(a.id) === String(accountId));
  return account?.currency || DEFAULT_FINANCE_CURRENCY;
}

export function formatAccountLabel(account) {
  if (!account) return '';
  const currency = account.currency || DEFAULT_FINANCE_CURRENCY;
  return `${account.name} (${currency})`;
}
