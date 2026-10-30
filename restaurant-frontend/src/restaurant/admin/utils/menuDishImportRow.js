import { parsePortionAmountInput } from '../../shared/utils/portionAmountInput';

function findById(list, id) {
  if (id == null || id === '') return null;
  return list.find((row) => String(row.id) === String(id)) || null;
}

/**
 * Recompute preview row after user edits draft fields in import workspace.
 */
export function patchMenuDishImportRow(row, patch, {
  stations = [],
  menuCategories = [],
} = {}) {
  const draft = {
    ...row.draft,
    ...patch,
  };

  if (Object.prototype.hasOwnProperty.call(patch, 'name')) {
    draft.name = String(patch.name || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'sku')) {
    draft.sku = String(patch.sku || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'price')) {
    const num = Number(patch.price);
    draft.price = Number.isFinite(num) ? num : 0;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'taxRate')) {
    const num = Number(patch.taxRate);
    draft.taxRate = Number.isFinite(num) ? num : 0;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'portionAmount')) {
    const raw = String(patch.portionAmount ?? '').trim();
    if (!raw) {
      draft.portionAmount = null;
      draft.portionUnit = null;
    } else {
      draft.portionAmount = parsePortionAmountInput(raw);
      draft.portionUnit = draft.portionAmount == null
        ? null
        : (draft.portionUnit || 'PORTION');
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'portionUnit') && draft.portionAmount != null) {
    draft.portionUnit = String(patch.portionUnit || 'PORTION').toUpperCase();
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'prepMinutes')) {
    const raw = String(patch.prepMinutes ?? '').trim();
    draft.prepMinutes = raw === '' ? null : Math.round(Number(raw));
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'description')) {
    draft.description = String(patch.description || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'portionLabel')) {
    draft.portionLabel = String(patch.portionLabel || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'tags')) {
    draft.tags = String(patch.tags || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'ikpu')) {
    draft.ikpu = String(patch.ikpu || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'packageCode')) {
    draft.packageCode = String(patch.packageCode || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'unitOfMeasure')) {
    draft.unitOfMeasure = String(patch.unitOfMeasure || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'unitMeasureCode')) {
    draft.unitMeasureCode = String(patch.unitMeasureCode || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'barcode')) {
    draft.barcode = String(patch.barcode || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'imageUrl')) {
    draft.imageUrl = String(patch.imageUrl || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'menuCategoryId')) {
    draft.menuCategoryId = patch.menuCategoryId || null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'stationId')) {
    draft.stationId = patch.stationId || null;
  }

  const errors = [];
  if (!draft.name) errors.push('name');
  if (!(Number(draft.price) >= 0) || draft.price === '' || draft.price == null) {
    errors.push('price');
  }
  if (
    Object.prototype.hasOwnProperty.call(patch, 'portionAmount')
    && String(patch.portionAmount ?? '').trim()
    && draft.portionAmount == null
  ) {
    errors.push('portionAmount');
  }

  const category = findById(menuCategories, draft.menuCategoryId);
  const station = findById(stations, draft.stationId);

  let tasnifStatus = row.tasnifStatus || 'idle';
  if (Object.prototype.hasOwnProperty.call(patch, 'tasnifStatus')) {
    tasnifStatus = patch.tasnifStatus;
  } else if (Object.prototype.hasOwnProperty.call(patch, 'ikpu')) {
    tasnifStatus = draft.ikpu ? 'ok' : 'idle';
  }

  return {
    ...row,
    name: draft.name,
    sku: draft.sku || '',
    price: draft.price,
    categoryName: category?.name || row.categoryName || '',
    stationName: station?.name || row.stationName || '',
    hasIkpu: Boolean(draft.ikpu),
    hasPhoto: Boolean(draft.imageUrl),
    tasnifStatus,
    tasnifMatchedName: Object.prototype.hasOwnProperty.call(patch, 'tasnifMatchedName')
      ? patch.tasnifMatchedName
      : row.tasnifMatchedName,
    errors,
    draft,
    ok: errors.length === 0,
  };
}
