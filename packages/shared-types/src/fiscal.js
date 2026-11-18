export const FISCAL_PROVIDER = Object.freeze({
  MULTIKASSA: 'MULTIKASSA',
  FISCAL_DRIVE: 'FISCAL_DRIVE',
});

export const DEFAULT_FISCAL_PROVIDER = FISCAL_PROVIDER.MULTIKASSA;

/**
 * Категория пластиковой карты по стандарту ОФД ГНК (разделена от платёжной системы UZCARD/HUMO).
 */
export const CARD_CATEGORY = Object.freeze({
  CORPORATE: 'CORPORATE',
  PERSONAL: 'PERSONAL',
  SOCIAL: 'SOCIAL',
});

/** Числовые коды ОФД (CardType: 1 = Корпоративная, 2 = Личная, 3 = Социальная). */
export const OFD_CARD_TYPE_CODE = Object.freeze({
  [CARD_CATEGORY.CORPORATE]: 1,
  [CARD_CATEGORY.PERSONAL]: 2,
  [CARD_CATEGORY.SOCIAL]: 3,
});

export function isFiscalDriveProvider(capsOrId) {
  const key =
    capsOrId && typeof capsOrId === 'object' && !Array.isArray(capsOrId)
      ? capsOrId.fiscalProvider
      : capsOrId;
  return String(key || '').trim().toUpperCase() === FISCAL_PROVIDER.FISCAL_DRIVE;
}
