/** Weight-sold dishes: admin sets base kg (≤10) + price; POS picks grams. */

const MAX_KG = 10;
const PRESET_GRAMS = [100, 200, 300, 1000];

export function menuWeightPresets() {
  return PRESET_GRAMS;
}

export function menuRefGrams(item) {
  if (!item) return null;
  const unit = String(item.portionUnit || '').toUpperCase();
  const amount = Number(item.portionAmount);
  if (unit === 'KG' && Number.isFinite(amount) && amount > 0) {
    return Math.round(amount * 1000);
  }
  if (unit === 'G' && Number.isFinite(amount) && amount > 0) {
    return Math.round(amount);
  }
  const grams = Number(item.portionGrams);
  if (Number.isFinite(grams) && grams > 0 && unit === 'KG') return grams;
  return null;
}

/** Sold by weight when admin set unit = KG and base weight + price. */
export function isWeightSoldMenuItem(item) {
  if (String(item?.portionUnit || '').toUpperCase() !== 'KG') return false;
  const ref = menuRefGrams(item);
  const price = Number(item?.price);
  return ref != null && ref > 0 && Number.isFinite(price) && price >= 0;
}

export function menuQtyFromGrams(item, grams) {
  const ref = menuRefGrams(item);
  const g = Number(grams);
  if (!ref || !(g > 0)) return null;
  return Math.round((g / ref) * 1000) / 1000;
}

export function menuAmountFromGrams(item, grams) {
  const qty = menuQtyFromGrams(item, grams);
  if (qty == null) return null;
  return Math.round((qty * (Number(item.price) || 0)) * 100) / 100;
}

export function menuGramsFromAmount(item, amount) {
  const ref = menuRefGrams(item);
  const price = Number(item?.price);
  const money = Number(amount);
  if (!ref || !(price > 0) || !(money > 0)) return null;
  return Math.max(1, Math.round((money / price) * ref));
}

export function menuWeightAdminMax(unit) {
  return String(unit || '').toUpperCase() === 'G' ? MAX_KG * 1000 : MAX_KG;
}

export function menuWeightNote(grams) {
  const g = Math.round(Number(grams) || 0);
  if (!(g > 0)) return '';
  if (g >= 1000 && g % 1000 === 0) return `${g / 1000} кг`;
  return `${g} г`;
}
