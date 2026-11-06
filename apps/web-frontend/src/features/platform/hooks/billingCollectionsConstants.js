export const COLLECTION_TABS = ['ALL', 'OVERDUE', 'DUE_SOON', 'ACTIVE', 'NEW', 'SUSPENDED'];
export const PAYMENT_METHODS = ['CLICK', 'PAYME', 'BANK_TRANSFER', 'CASH', 'OTHER'];
export const DATE_FIELDS = ['NEXT_CHARGE', 'LAST_PAYMENT', 'CREATED'];
export const COLLECTIONS_QUERY_KEY = 'platform-billing-collections';
export const MAX_BILLING_AMOUNT = 1_000_000_000;

export const TAB_COUNT_FIELD = {
  ALL: 'totalCompanies',
  OVERDUE: 'overdueCount',
  DUE_SOON: 'dueSoonCount',
  ACTIVE: 'activeCount',
  NEW: 'newCompanies',
  SUSPENDED: 'suspendedCount',
};

export function tabParams(tab) {
  if (tab === 'ALL') return {};
  if (tab === 'NEW') return { newOnly: true };
  return { state: tab };
}

export function rowKey(row) {
  return row?.billing?.companyId;
}
