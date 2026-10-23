export const FISCAL_PROVIDER = Object.freeze({
  MULTIKASSA: 'MULTIKASSA',
  FISCAL_DRIVE: 'FISCAL_DRIVE',
});

export const DEFAULT_FISCAL_PROVIDER = FISCAL_PROVIDER.MULTIKASSA;

/** Касса на FiscalDrive (ФМ 0400). Пустой/чужой id — Multikassa, как раньше. */
export function isFiscalDriveProvider(capsOrId) {
  const key =
    capsOrId && typeof capsOrId === 'object' && !Array.isArray(capsOrId)
      ? capsOrId.fiscalProvider
      : capsOrId;
  return String(key || '').trim().toUpperCase() === FISCAL_PROVIDER.FISCAL_DRIVE;
}
