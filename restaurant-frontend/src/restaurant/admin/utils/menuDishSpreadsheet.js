import {
  MENU_DISH_COLUMNS,
  MENU_DISH_HEADERS,
  mapHeaderToKey,
} from './menuDishSpreadsheetColumns';
import { parsePortionAmountInput } from '../../shared/utils/portionAmountInput';

/** Lazy: keep xlsx out of the admin menu initial bundle. */
async function loadXlsx() {
  return import('xlsx');
}

function cellStr(value) {
  if (value == null) return '';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return String(value).trim();
}

function parseBool(value, fallback = true) {
  const raw = cellStr(value).toLowerCase();
  if (!raw) return fallback;
  if (['1', 'true', 'yes', 'y', 'да', 'истина', 'on', 'активно', 'available'].includes(raw)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'нет', 'ложь', 'off', 'недоступно'].includes(raw)) {
    return false;
  }
  return fallback;
}

function parseNumber(value) {
  const raw = cellStr(value).replace(/\s/g, '').replace(',', '.');
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function findByName(list, name) {
  const q = cellStr(name).toLowerCase();
  if (!q) return null;
  return list.find((row) => String(row.name || '').trim().toLowerCase() === q) || null;
}

export function dishToSpreadsheetRow(item, { stations = [], menuCategories = [] } = {}) {
  const station = stations.find((s) => s.id === item.stationId);
  const category = menuCategories.find((c) => c.id === item.menuCategoryId)
    || (item.category ? { name: item.category } : null);
  return {
    name: item.name ?? '',
    sku: item.sku ?? '',
    price: item.price ?? '',
    taxRate: item.taxRate ?? 0,
    available: item.available === false ? 'no' : 'yes',
    sortOrder: item.sortOrder ?? 100,
    category: category?.name ?? item.category ?? '',
    station: station?.name ?? '',
    description: item.description ?? '',
    prepMinutes: item.prepMinutes ?? '',
    portionAmount: item.portionAmount ?? item.portionGrams ?? '',
    portionUnit: item.portionUnit ?? '',
    portionLabel: item.portionLabel ?? '',
    tags: item.tags ?? '',
    ikpu: item.ikpu ?? '',
    packageCode: item.packageCode ?? '',
    unitOfMeasure: item.unitOfMeasure ?? '',
    unitMeasureCode: item.unitMeasureCode ?? '',
    barcode: item.barcode ?? '',
    markedProduct: item.markedProduct ? 'yes' : 'no',
    // Photos: http(s) link or aurent-menu-img:{id} from API (data: too large for Excel cells).
    imageUrl: item.imageUrl && !String(item.imageUrl).startsWith('data:')
      ? String(item.imageUrl)
      : '',
    tasnifQuery: '',
  };
}

export function buildMenuDishSheetMatrix(rows) {
  return [
    MENU_DISH_HEADERS,
    ...rows.map((row) => MENU_DISH_COLUMNS.map((col) => row[col.key] ?? '')),
  ];
}

export async function workbookBytesFromMatrix(matrix, sheetName = 'Menu') {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  ws['!cols'] = MENU_DISH_HEADERS.map((header) => ({
    wch: Math.min(36, Math.max(12, header.length + 4)),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export async function buildMenuDishExportBytes(items, ctx) {
  const rows = (items || []).map((item) => dishToSpreadsheetRow(item, ctx));
  return workbookBytesFromMatrix(buildMenuDishSheetMatrix(rows));
}

export async function buildMenuDishTemplateBytes() {
  const example = {
    name: 'Pizza Margherita',
    sku: '',
    price: 45000,
    taxRate: 0,
    available: 'yes',
    sortOrder: 100,
    category: 'Pizza',
    station: 'Kitchen',
    description: '',
    prepMinutes: 15,
    portionAmount: 1,
    portionUnit: 'PORTION',
    portionLabel: '',
    tags: '',
    ikpu: '',
    packageCode: '',
    unitOfMeasure: '',
    unitMeasureCode: '',
    barcode: '',
    markedProduct: 'no',
    imageUrl: '',
    tasnifQuery: 'Pizza Margherita',
  };
  return workbookBytesFromMatrix(buildMenuDishSheetMatrix([example]));
}

export async function parseMenuDishWorkbook(arrayBuffer) {
  const XLSX = await loadXlsx();
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!aoa.length) return [];

  const headerRow = aoa[0].map((cell) => cellStr(cell));
  const keyByIndex = headerRow.map((header) => mapHeaderToKey(header));
  if (!keyByIndex.some(Boolean)) {
    throw new Error('NO_HEADERS');
  }

  const rows = [];
  for (let i = 1; i < aoa.length; i += 1) {
    const line = aoa[i] || [];
    const raw = {};
    let hasAny = false;
    keyByIndex.forEach((key, idx) => {
      if (!key) return;
      const value = cellStr(line[idx]);
      if (value) hasAny = true;
      raw[key] = value;
    });
    if (!hasAny) continue;
    rows.push({
      rowNum: i + 1,
      raw,
    });
  }
  return rows;
}

/**
 * Normalize parsed row into create/update payload fields + validation.
 */
export function normalizeMenuDishImportRow(parsed, {
  stations = [],
  menuCategories = [],
  existingItems = [],
} = {}) {
  const raw = parsed.raw || {};
  const name = cellStr(raw.name);
  const price = parseNumber(raw.price);
  const errors = [];
  if (!name) errors.push('name');
  if (price == null || price < 0) errors.push('price');

  const sku = cellStr(raw.sku);
  const existing = sku
    ? existingItems.find((item) => String(item.sku || '').trim().toLowerCase() === sku.toLowerCase())
    : null;

  const category = findByName(menuCategories, raw.category);
  const station = findByName(stations, raw.station);

  let portionAmount = null;
  if (cellStr(raw.portionAmount)) {
    portionAmount = parsePortionAmountInput(raw.portionAmount);
    if (portionAmount == null) errors.push('portionAmount');
  }
  const portionUnit = portionAmount == null
    ? null
    : (cellStr(raw.portionUnit).toUpperCase() || 'PORTION');

  const taxRate = parseNumber(raw.taxRate);
  const sortOrder = parseNumber(raw.sortOrder);
  const prepMinutes = parseNumber(raw.prepMinutes);

  const draft = {
    name,
    sku: sku || null,
    price: price ?? 0,
    taxRate: taxRate ?? 0,
    available: parseBool(raw.available, true),
    sortOrder: sortOrder ?? 100,
    itemType: 'DISH',
    stationId: station?.id ?? null,
    menuCategoryId: category?.id ?? null,
    imageUrl: cellStr(raw.imageUrl) || null,
    description: cellStr(raw.description) || null,
    prepMinutes: prepMinutes == null ? null : Math.round(prepMinutes),
    portionAmount,
    portionUnit,
    portionLabel: cellStr(raw.portionLabel) || null,
    tags: cellStr(raw.tags) || null,
    modifierGroupIds: existing?.modifierGroupIds ?? [],
    ikpu: cellStr(raw.ikpu) || null,
    packageCode: cellStr(raw.packageCode) || null,
    unitOfMeasure: cellStr(raw.unitOfMeasure) || null,
    unitMeasureCode: cellStr(raw.unitMeasureCode) || null,
    barcode: cellStr(raw.barcode) || null,
    markedProduct: parseBool(raw.markedProduct, false),
  };

  return {
    rowNum: parsed.rowNum,
    name,
    sku,
    price: draft.price,
    categoryName: cellStr(raw.category),
    stationName: cellStr(raw.station),
    tasnifQuery: cellStr(raw.tasnifQuery) || name,
    hasIkpu: Boolean(draft.ikpu),
    hasPhoto: Boolean(draft.imageUrl),
    tasnifStatus: draft.ikpu ? 'ok' : 'idle',
    tasnifMatchedName: '',
    existingId: existing?.id ?? null,
    action: existing ? 'UPDATE' : 'CREATE',
    categoryMatched: Boolean(!cellStr(raw.category) || category),
    stationMatched: Boolean(!cellStr(raw.station) || station),
    errors,
    draft,
    ok: errors.length === 0,
  };
}
