import {
  productAttr,
  productCountry,
  productDosageForm,
  productUnitsInPack,
  productRequiresPrescription,
  productSellByPiece,
  productPieceStep,
} from '../../pharmacy-cashier/utils/pharmacyProductMeta';

/** Сборка CreateProductRequest для аптечной карточки (цены — заглушки до прихода). */

export function buildPharmacyProductCreatePayload(form, { storeId, prices } = {}) {
  const name = String(form.name || '').trim();
  const unitsInPack = Number(form.unitsInPack) > 0 ? Number(form.unitsInPack) : 1;
  const packSale = unitsInPack > 1;
  const sellByPiece = packSale && !form.doNotSellByPiece;
  const pieceStep = sellByPiece && Number(form.pieceStep) > 1
    ? Math.round(Number(form.pieceStep))
    : undefined;
  const sku = String(form.sku || '').trim() || autoPharmacySku(name);
  const barcode = String(form.barcode || '').trim() || undefined;
  const extra = (form.additionalBarcodes || [])
    .map((b) => String(b || '').trim())
    .filter(Boolean);

  const attributes = {
    manufacturer: String(form.manufacturer || '').trim() || undefined,
    dosage_form: String(form.dosageForm || '').trim() || undefined,
    country: String(form.country || '').trim() || undefined,
    units_in_pack: String(unitsInPack),
    prescription_required: form.prescriptionRequired ? 'true' : undefined,
    atc_code: String(form.atcCode || '').trim() || undefined,
    sell_by_piece: packSale ? String(sellByPiece) : undefined,
    piece_step: pieceStep ? String(pieceStep) : undefined,
  };
  Object.keys(attributes).forEach((k) => {
    if (attributes[k] == null || attributes[k] === '') delete attributes[k];
  });

  const costPrice = prices?.costPrice != null ? Number(prices.costPrice) : 0;
  const sellingRaw = prices?.sellingPrice != null ? Number(prices.sellingPrice) : 0.01;
  const sellingPrice = sellingRaw >= 0.01 ? sellingRaw : 0.01;
  const taxRate = prices?.taxRate != null
    ? Number(prices.taxRate)
    : (form.taxRate != null && form.taxRate !== '' ? Number(form.taxRate) : 0);

  const payload = {
    sku,
    name,
    costPrice,
    sellingPrice,
    taxRate,
    productType: 'RETAIL',
    saleType: 'PIECE',
    unitCode: 'PCS',
    quantityScale: packSale ? 3 : 0,
    allowFraction: packSale,
    initialStock: 0,
    barcode,
    ikpu: String(form.ikpu || '').trim() || undefined,
    packageCode: String(form.packageCode || '').trim() || undefined,
    ikpuStatus: form.ikpuStatus || (String(form.ikpu || '').trim() ? 'MANUAL' : undefined),
    unitOfMeasure: 'pcs',
    soldIndividually: sellByPiece,
    markedProduct: Boolean(form.markedProduct),
    ownerType: 'OWN',
    businessTypeCode: 'PHARMACY',
    attributes,
    additionalBarcodes: extra.length ? extra : undefined,
  };

  if (storeId != null) {
    payload.storePrices = [{
      storeId: Number(storeId),
      sellingPrice,
      costPrice,
    }];
  }

  return payload;
}

export function autoPharmacySku(name) {
  const slug = String(name || 'item')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9А-ЯЁ]+/gi, '')
    .slice(0, 8) || 'ITEM';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PHARM-${slug}-${rand}`;
}

export function validatePharmacyProductForm(form, t) {
  if (!String(form.name || '').trim() || String(form.name).trim().length < 2) {
    return t('pharmacyStock.productErrName');
  }
  if (!String(form.manufacturer || '').trim()) {
    return t('pharmacyStock.productErrManufacturer');
  }
  if (!String(form.dosageForm || '').trim()) {
    return t('pharmacyStock.productErrForm');
  }
  if (!(Number(form.unitsInPack) > 0)) {
    return t('pharmacyStock.productErrPack');
  }
  const pack = Number(form.unitsInPack);
  if (pack > 1 && !form.doNotSellByPiece) {
    const step = Number(form.pieceStep);
    if (form.pieceStep != null && String(form.pieceStep).trim() !== '' && (
      !Number.isFinite(step) || step < 1 || step >= pack
    )) {
      return t('pharmacyStock.productErrPieceStep');
    }
  }
  return null;
}

export function emptyPharmacyProductForm() {
  return {
    name: '',
    sku: '',
    barcode: '',
    additionalBarcodes: [],
    manufacturer: '',
    dosageForm: '',
    country: '',
    unitsInPack: '1',
    doNotSellByPiece: false,
    pieceStep: '',
    ikpu: '',
    packageCode: '',
    packageName: '',
    ikpuStatus: '',
    prescriptionRequired: false,
    markedProduct: false,
    taxRate: '0',
    atcCode: '',
    active: true,
  };
}

export function formFromPharmacyProduct(product) {
  if (!product) return emptyPharmacyProductForm();
  const primary = String(product.barcode || '').trim();
  const extras = (product.barcodes || product.additionalBarcodes || [])
    .map((b) => String(b || '').trim())
    .filter((b) => b && b !== primary);
  return {
    name: product.name || '',
    sku: product.sku || '',
    barcode: primary,
    additionalBarcodes: extras,
    manufacturer: productManufacturerLike(product),
    dosageForm: productDosageForm(product),
    country: productCountry(product),
    unitsInPack: String(productUnitsInPack(product) || 1),
    doNotSellByPiece: (productUnitsInPack(product) || 1) > 1 && !productSellByPiece(product),
    pieceStep: productPieceStep(product) > 1 ? String(productPieceStep(product)) : '',
    ikpu: product.ikpu || '',
    packageCode: product.packageCode || '',
    packageName: product.packageName || '',
    ikpuStatus: product.ikpuStatus || '',
    prescriptionRequired: productRequiresPrescription(product),
    markedProduct: Boolean(product.markedProduct),
    taxRate: product.taxRate != null ? String(product.taxRate) : '0',
    atcCode: productAttr(product, 'atc_code', 'atc', 'атх', 'atcCode'),
    active: product.active !== false,
  };
}

function productManufacturerLike(product) {
  return productAttr(product, 'manufacturer', 'производитель', 'producer')
    || String(product?.manufacturer || '').trim();
}

export function buildPharmacyProductUpdatePayload(form, existing) {
  const created = buildPharmacyProductCreatePayload(form, {});
  delete created.sku;
  delete created.initialStock;
  delete created.storePrices;
  const attributes = {
    ...(existing?.attributes || {}),
    ...created.attributes,
  };
  if (created.attributes.sell_by_piece == null) delete attributes.sell_by_piece;
  else attributes.sell_by_piece = created.attributes.sell_by_piece;
  if (created.attributes.piece_step == null) delete attributes.piece_step;
  else attributes.piece_step = created.attributes.piece_step;
  return {
    ...created,
    costPrice: existing?.costPrice ?? created.costPrice,
    sellingPrice: existing?.sellingPrice ?? created.sellingPrice,
    active: form.active !== false,
    attributes,
  };
}
