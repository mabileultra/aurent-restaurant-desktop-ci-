import { LABEL_SIZE_PRESETS } from './labelSizePresets';
/** @typedef {'label'|'priceTag'} ShelfLabelVariant */
/** @typedef {'auto'|'manual'} ShelfLabelLayoutMode */
/** @typedef {'micro'|'standard'|'large'|'marketplace'} LabelSizeCategory */

/**
 * @typedef {object} LabelSizePreset
 * @property {string} id
 * @property {LabelSizeCategory} category
 * @property {number} paperWmm
 * @property {number} paperHmm
 * @property {string} profileId — имя профиля бумаги в Windows (должно совпадать)
 * @property {number} padXmm
 * @property {number} padYmm
 * @property {number} fontScale
 * @property {string} i18nKey
 * @property {number} [offsetXmm] — калибровка вправо (+)
 * @property {number} [offsetYmm] — калибровка вверх (+)
 * @property {boolean} [rotate180] — поворот для термопринтера при отрыве
 * @property {boolean} [widePrinterOnly] — шире 82 мм (XP-365B не поддерживает)
 */

/** @typedef {object} ShelfLabelLayoutSettings
 * @property {string} [presetId]
 * @property {boolean} rotate180
 * @property {number} fontScale
 * @property {number} padXmm
 * @property {number} padYmm
 * @property {number} offsetXmm
 * @property {number} offsetYmm
 * @property {number} paperWmm
 * @property {number} paperHmm
 * @property {number} pageMarginMm
 * @property {ShelfLabelLayoutMode} [layoutMode]
 */

/** Макс. ширина печати XP-365B и аналогов (мм). */
export const LABEL_PRINTER_STANDARD_MAX_WIDTH_MM = 82;

export const DEFAULT_PRESET_ID = 'standard_58_40';

export const LABEL_PRINT_SETTINGS_KEY = 'aurent_label_print_settings_v4';

/** Глобальное увеличение текста этикетки (~6%). Калибровку и layout не меняет. */
export const LABEL_TEXT_SIZE_BOOST = 1.06;

/** @param {number} [fontScale] */
export function effectiveLabelFontScale(fontScale) {
  return Math.min(1.6, (Number(fontScale) || 1) * LABEL_TEXT_SIZE_BOOST);
}

/** @param {string} id */
export function getLabelPresetById(id) {
  return LABEL_SIZE_PRESETS.find((p) => p.id === id) || null;
}

/** @param {number} w @param {number} h */
export function findLabelPresetBySize(w, h) {
  const ww = Number(w);
  const hh = Number(h);
  return (
    LABEL_SIZE_PRESETS.find((p) => p.paperWmm === ww && p.paperHmm === hh) ||
    LABEL_SIZE_PRESETS.find(
      (p) => Math.abs(p.paperWmm - ww) < 0.5 && Math.abs(p.paperHmm - hh) < 0.5
    ) ||
    null
  );
}

/** @param {Partial<ShelfLabelLayoutSettings>} layout */
export function findLabelPresetByLayout(layout) {
  if (layout?.presetId) {
    const byId = getLabelPresetById(layout.presetId);
    if (byId) return byId;
  }
  return findLabelPresetBySize(layout?.paperWmm, layout?.paperHmm);
}

/** @param {string} presetId @param {Partial<ShelfLabelLayoutSettings>} [overrides] */
export function layoutFromPreset(presetId, overrides = {}) {
  const preset = getLabelPresetById(presetId) || getLabelPresetById(DEFAULT_PRESET_ID);
  return {
    presetId: preset.id,
    paperWmm: preset.paperWmm,
    paperHmm: preset.paperHmm,
    padXmm: preset.padXmm,
    padYmm: preset.padYmm,
    offsetXmm: preset.offsetXmm ?? 0,
    offsetYmm: preset.offsetYmm ?? 0,
    fontScale: preset.fontScale,
    rotate180: Boolean(preset.rotate180),
    pageMarginMm: 0,
    layoutMode: 'manual',
    ...overrides,
  };
}

/** @param {LabelSizePreset} preset */
export function isWidePrinterPreset(preset) {
  return Boolean(preset?.widePrinterOnly) || Number(preset?.paperWmm) > LABEL_PRINTER_STANDARD_MAX_WIDTH_MM;
}

/** @type {ShelfLabelLayoutSettings} */
export const DEFAULT_LABEL_LAYOUT = layoutFromPreset(DEFAULT_PRESET_ID);

export { LABEL_SIZE_CATEGORIES, LABEL_SIZE_PRESETS } from './labelSizePresets';
