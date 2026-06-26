import { buildStorePrices } from '../../../utils/productCatalogPrices';
import { buildAttributesPayload } from './productCatalogFormDefaults';

export function buildProductCatalogPayload({
  values,
  storeRows,
  extraBarcodes,
  effectiveBusinessType,
  businessConfigFields,
  showSection,
}) {
  const storePrices = buildStorePrices(storeRows, values.sellingPrice);
  const additionalBarcodes = extraBarcodes.map((b) => b.trim()).filter(Boolean);

  return {
    name: values.name,
    description: values.description || undefined,
    categoryId: values.categoryId || null,
    costPrice: values.costPrice,
    sellingPrice: values.sellingPrice,
    defaultDiscountPercent: values.defaultDiscountPercent ?? 0,
    taxRate: values.taxRate,
    lowStockAlert: values.lowStockAlert,
    storageLocation: values.storageLocation?.trim() || null,
    barcode: values.barcode || undefined,
    externalProductId: values.externalProductId || undefined,
    ikpu: values.ikpu || undefined,
    productType: values.productType,
    saleType: values.saleType,
    unitCode: values.unitCode,
    quantityScale: values.quantityScale,
    allowFraction: values.allowFraction,
    unitOfMeasure: values.unitOfMeasure,
    unitMeasureCode: values.unitMeasureCode || undefined,
    packageCode: values.packageCode || undefined,
    soldIndividually: values.productType === 'RETAIL' ? values.soldIndividually : undefined,
    markedProduct: values.productType === 'RETAIL' ? values.markedProduct : undefined,
    ownerType: values.ownerType,
    commissionTin: values.commissionTin || undefined,
    commissionPinfl: values.commissionPinfl || undefined,
    businessTypeCode: effectiveBusinessType,
    attributes: buildAttributesPayload(values, businessConfigFields),
    storePrices,
    additionalBarcodes,
  };
}
