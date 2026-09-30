import { resolveStorePricesForPayload } from '../../../utils/productCatalogPrices';
import { buildAttributesPayload } from './productCatalogFormDefaults';
import {
  isCatalogSectionOn,
  pickVisibleCatalogFormValues,
} from './pickVisibleCatalogFormValues';

export function buildProductCatalogPayload({
  values,
  storeRows,
  extraBarcodes,
  effectiveBusinessType,
  businessConfigFields,
  showSection,
  selectedStoreId = null,
  stores = null,
}) {
  const visible = pickVisibleCatalogFormValues(values, showSection);

  const storePricesEnabled = isCatalogSectionOn(showSection, 'storePrices');
  const fallbackStoreIds = Array.isArray(stores)
    ? stores.map((s) => s?.id).filter((id) => id != null && id !== '')
    : null;
  const storePrices = resolveStorePricesForPayload({
    storeRows,
    sellingPrice: visible.sellingPrice,
    storePricesEnabled,
    fallbackStoreId: selectedStoreId,
    fallbackStoreIds,
  });

  const barcodesOn = isCatalogSectionOn(showSection, 'extraBarcodes');
  const additionalBarcodes = barcodesOn
    ? (extraBarcodes || []).map((b) => b.trim()).filter(Boolean)
    : [];

  const dynamicOn = isCatalogSectionOn(showSection, 'dynamicFields');
  const attributes = dynamicOn
    ? buildAttributesPayload(values, businessConfigFields)
    : undefined;

  return {
    name: visible.name,
    description: visible.description,
    categoryId: visible.categoryId,
    costPrice: visible.costPrice,
    sellingPrice: visible.sellingPrice,
    defaultDiscountPercent: visible.defaultDiscountPercent,
    taxRate: visible.taxRate,
    lowStockAlert: visible.lowStockAlert,
    storageLocation: visible.storageLocation,
    barcode: visible.barcode,
    plu: visible.plu,
    externalProductId: visible.externalProductId,
    ikpu: visible.ikpu,
    productType: visible.productType,
    saleType: visible.saleType,
    unitCode: visible.unitCode,
    quantityScale: visible.quantityScale,
    allowFraction: visible.allowFraction,
    unitOfMeasure: visible.unitOfMeasure,
    unitMeasureCode: visible.unitMeasureCode,
    packageCode: visible.packageCode,
    soldIndividually: visible.soldIndividually,
    markedProduct: visible.markedProduct,
    ownerType: visible.ownerType,
    commissionTin: visible.commissionTin,
    commissionPinfl: visible.commissionPinfl,
    businessTypeCode: effectiveBusinessType,
    attributes,
    storePrices,
    additionalBarcodes,
  };
}
