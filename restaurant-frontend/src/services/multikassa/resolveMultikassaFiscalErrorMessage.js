/** Сообщения об ошибках Multikassa для toast на кассе. */
export function resolveMultikassaFiscalErrorMessage(e, t, fallbackKey = 'cashRegisters.multikassa.fiscalFailed') {
  if (e?.code === 'MULTIKASSA_OFFLINE_BLOCKED' || e?.message === 'MULTIKASSA_OFFLINE_BLOCKED') {
    return t('cashRegisters.multikassa.fiscalOfflineBlocked');
  }
  if (e?.code === 'MULTIKASSA_BROWSER_LOCALHOST') {
    return e.message;
  }
  if (e?.code === 'MULTIKASSA_CAPABILITIES_LOAD_FAILED') {
    return e.message || t('cashRegisters.multikassa.capabilitiesLoadFailed');
  }
  const raw = String(e?.response?.data?.message ?? e?.data?.message ?? e?.message ?? '');
  if (/принтер не найден|ошибка принтера|printer not found/i.test(raw)) {
    return t('cashRegisters.multikassa.mkPrinterMissing');
  }
  if (e?.code === 'MULTIKASSA_FISCAL_FAILED') {
    return e.message || t(fallbackKey);
  }
  return raw || t(fallbackKey);
}
