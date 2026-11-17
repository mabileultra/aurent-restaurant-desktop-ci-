import { useEffect, useRef } from 'react';
import { applyBusinessConfigDefaults } from '../../../config/productCatalogConfig';
import { businessAttributeFieldName } from '../components/products/catalog/ProductCatalogDynamicFieldsSection';
import {
  attributeFormValue,
  defaultProductCatalogFormValues,
} from '../utils/productCatalogFormDefaults';

export function useProductCatalogHydration({
  isEdit,
  full,
  detail,
  businessConfig,
  reset,
  setValue,
  setStoreRows,
  setExtraBarcodes,
  prevSellingRef,
}) {
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (isEdit || !businessConfig || defaultsAppliedRef.current) return;
    reset({
      ...defaultProductCatalogFormValues,
      ...applyBusinessConfigDefaults(businessConfig),
    });
    defaultsAppliedRef.current = true;
  }, [isEdit, businessConfig, reset]);

  const editProductId = isEdit ? full?.id : null;
  const editHydrationKey = isEdit && full
    ? `${full.id}:${detail ? 'detail' : 'list'}:${full.saleType || ''}:${full.updatedAt || full.version || ''}`
    : null;

  useEffect(() => {
    if (!isEdit || !full || !editProductId) return;
    defaultsAppliedRef.current = true;
    reset({
      sku: full.sku,
      name: full.name,
      description: full.description ?? '',
      categoryId: full.categoryId != null && full.categoryId !== '' ? String(full.categoryId) : '',
      costPrice: full.costPrice,
      sellingPrice: full.sellingPrice,
      defaultDiscountPercent: full.defaultDiscountPercent ?? 0,
      taxRate: full.taxRate ?? 0,
      lowStockAlert: full.lowStockAlert ?? 10,
      initialStock: full.stockQuantity ?? 0,
      storageLocation: full.storageLocation ?? '',
      barcode: full.barcode ?? '',
      plu: full.plu ?? '',
      externalProductId: full.externalProductId ?? '',
      ikpu: full.ikpu ?? '',
      productType: full.productType || (full.saleType === 'SERVICE' ? 'SERVICE' : 'RETAIL'),
      saleType: full.saleType || 'PIECE',
      unitCode: full.unitCode || 'PCS',
      quantityScale: full.quantityScale ?? 0,
      allowFraction: full.allowFraction ?? false,
      unitOfMeasure: full.unitOfMeasure || 'pcs',
      unitMeasureCode: full.unitMeasureCode ?? '',
      packageCode: full.packageCode ?? '',
      soldIndividually: full.soldIndividually !== false,
      markedProduct: !!full.markedProduct,
      active: full.active !== false,
      ownerType: full.ownerType || 'OWN',
      commissionTin: full.commissionTin ?? '',
      commissionPinfl: full.commissionPinfl ?? '',
    });
    const prices = (full.storePrices && full.storePrices.length > 0
      ? full.storePrices
      : [{ storeId: '', price: '' }]).map((r) => ({
      storeId: r.storeId ?? '',
      price: r.price ?? '',
    }));
    setStoreRows(prices);
    const extras = (full.barcodes || []).filter((b) => b && b !== full.barcode);
    setExtraBarcodes(extras.length ? extras : ['']);
    prevSellingRef.current = full.sellingPrice ?? null;
  }, [editHydrationKey, editProductId, isEdit, reset, full, prevSellingRef, setExtraBarcodes, setStoreRows]);

  useEffect(() => {
    if (!full?.attributes || !businessConfig?.fields?.length) return;
    for (const field of businessConfig.fields) {
      const value = full.attributes[field.fieldKey];
      if (value == null && field.fieldType !== 'BOOLEAN') continue;
      setValue(
        businessAttributeFieldName(field.fieldKey),
        attributeFormValue(value ?? '', field.fieldType)
      );
    }
  }, [full?.attributes, businessConfig?.fields, setValue]);
}
