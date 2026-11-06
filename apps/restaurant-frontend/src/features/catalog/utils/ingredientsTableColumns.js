export const INGREDIENTS_COLUMNS_STORAGE_KEY = 'rst.ingredients.visibleColumns.v1';

export const INGREDIENTS_COLUMN_DEFS = [
  { id: 'no', labelKey: 'common.colNo', locked: true },
  { id: 'name', labelKey: 'products.colName', locked: true },
  { id: 'sku', labelKey: 'products.colSku' },
  { id: 'barcode', labelKey: 'products.import.colBarcode' },
  { id: 'type', labelKey: 'rst.nomenclature.typeLabel' },
  { id: 'category', labelKey: 'products.colCategory' },
  { id: 'cost', labelKey: 'productModal.cost', numeric: true },
  { id: 'price', labelKey: 'products.colPrice', numeric: true },
  { id: 'stock', labelKey: 'products.colStock', numeric: true },
];

const DEFAULT_VISIBLE = {
  no: true,
  name: true,
  sku: true,
  barcode: false,
  type: true,
  category: true,
  cost: true,
  price: true,
  stock: true,
};

export function loadIngredientsColumnVisibility() {
  try {
    const raw = localStorage.getItem(INGREDIENTS_COLUMNS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VISIBLE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_VISIBLE, ...parsed, no: true, name: true };
  } catch {
    return { ...DEFAULT_VISIBLE };
  }
}

export function saveIngredientsColumnVisibility(next) {
  try {
    localStorage.setItem(INGREDIENTS_COLUMNS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}
