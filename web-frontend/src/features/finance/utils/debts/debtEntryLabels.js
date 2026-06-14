export function debtEntryTypeLabel(t, entryType) {
  if (entryType === 'CHARGE') return t('finance.debts.entryCharge');
  if (entryType === 'PAYMENT') return t('finance.debts.entryPayment');
  return entryType ?? '—';
}

export function canShowDebtEntryDetail(entry) {
  return entry?.referenceKind === 'RECEIPT' || entry?.referenceKind === 'SALE';
}
