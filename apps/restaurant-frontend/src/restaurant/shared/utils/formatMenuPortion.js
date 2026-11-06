import { formatPortionAmountDisplay } from './portionAmountInput';

/** Display text for a fixed plate portion (menu item). */
export function formatMenuPortion(item) {
  const label = String(item?.portionLabel ?? '').trim();
  if (label) return label;

  const amount = Number(item?.portionAmount);
  if (Number.isFinite(amount) && amount > 0) {
    const unit = String(item?.portionUnit || 'PORTION').toUpperCase();
    const nice = formatPortionAmountDisplay(item.portionAmount);
    if (unit === 'G') return `${nice} г`;
    if (unit === 'KG') return `${nice} кг`;
    if (unit === 'PCS') {
      return amount === 1 || nice === '1' ? '1 шт' : `${nice} шт`;
    }
    // PORTION — плов 0.7 / лагман 0.5 / 1 порция / полтора
    if (nice === '1' || Math.abs(amount - 1) < 0.0005) return '1 порция';
    if (nice === '1.5' || Math.abs(amount - 1.5) < 0.0005) return 'полтора порции';
    return `${nice} порции`;
  }

  const grams = Number(item?.portionGrams);
  if (Number.isFinite(grams) && grams > 0) return `${Math.round(grams)} г`;
  return '';
}

/**
 * POS label for a size SKU. Never falls back to admin field hints.
 * When portion fields are empty, uses relative size names by sorted index.
 */
export function formatVariantPortionLabel(item, { index = 0, count = 1, t } = {}) {
  const explicit = formatMenuPortion(item);
  if (explicit) return explicit;

  if (typeof t === 'function') {
    if (count === 2) {
      return t(index === 0 ? 'rst.order.portionSizeSmall' : 'rst.order.portionSizeLarge');
    }
    if (count === 3) {
      const keys = [
        'rst.order.portionSizeSmall',
        'rst.order.portionSizeMedium',
        'rst.order.portionSizeLarge',
      ];
      return t(keys[index] || 'rst.order.portionSizeN', { n: index + 1 });
    }
    return t('rst.order.portionSizeN', { n: index + 1 });
  }

  if (count === 2) return index === 0 ? 'Маленькая' : 'Большая';
  if (count === 3) return ['Маленькая', 'Средняя', 'Большая'][index] || `Размер ${index + 1}`;
  return `Размер ${index + 1}`;
}
