/** Display text for a fixed plate portion (menu item). */
export function formatMenuPortion(item) {
  const label = String(item?.portionLabel ?? '').trim();
  if (label) return label;

  const amount = Number(item?.portionAmount);
  if (Number.isFinite(amount) && amount > 0) {
    const unit = String(item?.portionUnit || 'PORTION').toUpperCase();
    if (unit === 'G') return `${trimAmount(item.portionAmount)} г`;
    if (unit === 'KG') return `${trimAmount(item.portionAmount)} кг`;
    if (unit === 'PCS') {
      return amount === 1 ? '1 шт' : `${trimAmount(item.portionAmount)} шт`;
    }
    // PORTION — плов 0.7 / лагман 0.5 / 1 порция / полтора
    if (amount === 1) return '1 порция';
    if (amount === 1.5) return 'полтора порции';
    return `${trimAmount(item.portionAmount)} порции`;
  }

  const grams = Number(item?.portionGrams);
  if (Number.isFinite(grams) && grams > 0) return `${grams} г`;
  return '';
}

function trimAmount(raw) {
  return String(raw).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
