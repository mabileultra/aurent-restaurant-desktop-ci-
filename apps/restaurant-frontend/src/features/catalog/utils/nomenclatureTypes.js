/** Tabs for restaurant warehouse nomenclature (ProductType mapping). */

export const NOMENCLATURE_TYPE_TABS = [
  { key: 'ALL', productTypes: null },
  { key: 'PRODUCT', productTypes: ['RETAIL'] },
  // MATERIAL = ingredient; DISH kept for legacy cards wrongly saved as DISH
  { key: 'INGREDIENT', productTypes: ['MATERIAL', 'DISH'] },
];

export function filterRowsByNomenclatureType(rows, typeKey) {
  const tab = NOMENCLATURE_TYPE_TABS.find((row) => row.key === typeKey)
    ?? NOMENCLATURE_TYPE_TABS[0];
  const list = (rows ?? []).filter((row) => row.productType !== 'SERVICE');
  if (!tab.productTypes) return list;
  return list.filter((row) => {
    const type = row.productType || 'MATERIAL';
    return tab.productTypes.includes(type);
  });
}

export function nomenclatureTypeLabelKey(type) {
  switch (type) {
    case 'RETAIL':
      return 'rst.nomenclature.typeProduct';
    case 'MATERIAL':
      return 'rst.nomenclature.typeIngredient';
    case 'DISH':
      return 'rst.nomenclature.typeDish';
    case 'SERVICE':
      return 'rst.nomenclature.typeService';
    default:
      return 'rst.nomenclature.typeOther';
  }
}
