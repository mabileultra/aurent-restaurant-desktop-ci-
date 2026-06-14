export function resolveFinanceSourceDocument(sourceType, sourceId) {
  if (!sourceId) return null;
  if (sourceType === 'PURCHASE') {
    return { kind: 'RECEIPT', id: sourceId };
  }
  if (sourceType === 'SALE') {
    return { kind: 'SALE', id: sourceId };
  }
  if (sourceType === 'Z_REPORT' && sourceId) {
    const match = sourceId.match(/^z-report:(\d+)/);
    if (match) {
      return { kind: 'Z_REPORT', id: match[1] };
    }
  }
  return null;
}

export function financeSourceTypeLabel(t, sourceType) {
  if (!sourceType) return '—';
  return t(`finance.sourceTypes.${sourceType}`, { defaultValue: sourceType });
}

export function financePaymentMethodLabel(t, method) {
  if (!method) return '—';
  const key = `finance.payment.${method.toLowerCase()}`;
  return t(key, { defaultValue: method });
}
