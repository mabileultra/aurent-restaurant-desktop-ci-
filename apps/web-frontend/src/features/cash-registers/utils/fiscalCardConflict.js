export function normalizeFiscalCardId(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

export function findFiscalCardConflict(rows, { fiscalCardId, ignoreRegisterId } = {}) {
  const target = normalizeFiscalCardId(fiscalCardId);
  if (!target || !Array.isArray(rows)) return null;
  const ignoreId = ignoreRegisterId != null ? Number(ignoreRegisterId) : null;
  return (
    rows.find((row) => {
      if (!row) return false;
      if (ignoreId != null && Number(row.id) === ignoreId) return false;
      return normalizeFiscalCardId(row.fiscalCardId) === target;
    }) ?? null
  );
}

export function formatFiscalCardConflictMessage(t, row) {
  if (!row) return t('cashRegisters.fiscalCardConflict');
  if (row.registerNumber != null && row.storeName) {
    return t('cashRegisters.fiscalCardConflictWithRegister', {
      number: row.registerNumber,
      store: row.storeName,
    });
  }
  if (row.registerNumber != null) {
    return t('cashRegisters.fiscalCardConflictWithNumber', {
      number: row.registerNumber,
    });
  }
  return t('cashRegisters.fiscalCardConflict');
}

export function isConflictApiError(error) {
  const status = error?.response?.status;
  return status === 409 || error?.response?.data?.code === 'CONFLICT';
}
