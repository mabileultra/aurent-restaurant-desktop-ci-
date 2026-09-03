/** Сообщения об ошибках Multikassa для toast на кассе. */
export function resolveMultikassaFiscalErrorMessage(e, t, fallbackKey = 'cashRegisters.multikassa.fiscalFailed') {
  if (e?.code === 'MULTIKASSA_OFFLINE_BLOCKED' || e?.message === 'MULTIKASSA_OFFLINE_BLOCKED') {
    return t('cashRegisters.multikassa.fiscalOfflineBlocked');
  }
  if (e?.code === 'MULTIKASSA_BROWSER_LOCALHOST') {
    return e.message;
  }
  if (e?.code === 'MULTIKASSA_FISCAL_FAILED') {
    return e.message || t(fallbackKey);
  }
  return e?.response?.data?.message ?? e?.message ?? t(fallbackKey);
}
