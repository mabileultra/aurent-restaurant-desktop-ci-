import { useMemo, useEffect, useRef, useState } from 'react';
import { getStockUnits, UNIT_DEFAULTS } from '../../../utils/unitConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api';
import {
  applyBusinessConfigDefaults,
  CATALOG_PROFILE_RESTAURANT_INGREDIENT,
  normalizeBusinessTypeCode,
  resolveCatalogSectionVisible,
} from '../../../config/productCatalogConfig';
import { syncStoreRowPrices } from '../../../utils/productCatalogPrices';
import useBusinessConfig from '../../../hooks/useBusinessConfig';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { businessAttributeFieldName } from '../components/products/catalog/ProductCatalogDynamicFieldsSection';
import { buildProductCatalogPayload } from '../utils/buildProductCatalogPayload';
import {
  attributeFormValue,
  defaultProductCatalogFormValues,
} from '../utils/productCatalogFormDefaults';
import { createProductCatalogFormSchema } from '../utils/productCatalogFormSchema';
import { extractAttributeValues, parsePriceRules } from '../../../utils/businessConfigUtils';

export function useProductCatalogForm(product, stores, onSaved, options = {}) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const selectedStoreId = options.selectedStoreId ?? null;
  const selectedStoreBusinessType = options.selectedStoreBusinessType ?? null;
  const catalogProfile = options.catalogProfile ?? null;
  const isRestaurantIngredient = catalogProfile === CATALOG_PROFILE_RESTAURANT_INGREDIENT;
  const { businessType: companyBusinessType } = useCompanyBusinessType();
  const effectiveBusinessType = normalizeBusinessTypeCode(
    selectedStoreBusinessType ?? companyBusinessType ?? 'UNIVERSAL'
  );
  const { data: businessConfig, isLoading: businessConfigLoading } = useBusinessConfig(effectiveBusinessType);

  const { data: detail } = useQuery({
    queryKey: ['product', product?.id],
    queryFn: () => productApi.getById(product.id).then((r) => r.data),
    enabled: isEdit && !!product?.id,
  });
  const full = detail ?? product;

  const [storeRows, setStoreRows] = useState([{ storeId: '', price: '' }]);
  const [extraBarcodes, setExtraBarcodes] = useState(['']);
  const prevSellingRef = useRef(null);
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (isEdit || !selectedStoreId) return;
    setStoreRows((rows) => {
      if (rows.length === 1 && !rows[0].storeId) {
        return [{ storeId: String(selectedStoreId), price: rows[0].price ?? '' }];
      }
      return rows.map((row, idx) => (
        idx === 0 ? { ...row, storeId: String(selectedStoreId) } : row
      ));
    });
  }, [selectedStoreId, isEdit]);

  const schema = useMemo(
    () => createProductCatalogFormSchema(t, { catalogProfile }),
    [t, catalogProfile],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultProductCatalogFormValues,
  });

  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = form;
  const formValues = watch();
  const attributeValues = useMemo(() => extractAttributeValues(formValues), [formValues]);
  const priceRulesConfig = useMemo(
    () => parsePriceRules(businessConfig?.priceRules),
    [businessConfig?.priceRules]
  );

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
    // Only re-hydrate when product id / detail payload identity changes — not on every new object ref.
  }, [editHydrationKey, editProductId, isEdit, reset]);

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

  const sellingPriceWatch = watch('sellingPrice');
  const costPriceWatch = watch('costPrice');
  const saleTypeWatch = watch('saleType');
  const productTypeWatch = watch('productType');
  const unitCodeWatch = watch('unitCode');
  const ownerTypeWatch = watch('ownerType');
  const taxRateWatch = watch('taxRate');
  const categoryId = watch('categoryId');

  useEffect(() => {
    if (saleTypeWatch === 'SERVICE') {
      setValue('productType', 'SERVICE');
    }
  }, [saleTypeWatch, setValue]);

  useEffect(() => {
    if (saleTypeWatch === 'WEIGHT') {
      const currentUnit = getValues('unitCode');
      const measuredCodes = getStockUnits()
        .filter((u) => ['MASS', 'VOLUME', 'LENGTH', 'AREA'].includes(u.category))
        .map((u) => u.code);
      if (!measuredCodes.includes(currentUnit)) {
        setValue('unitCode', 'KG');
        const defaults = UNIT_DEFAULTS.KG;
        setValue('unitOfMeasure', defaults.unitOfMeasure);
        setValue('quantityScale', defaults.quantityScale);
        setValue('allowFraction', defaults.allowFraction);
      } else {
        setValue('allowFraction', true);
      }
    } else if (saleTypeWatch === 'SERVICE') {
      const defaults = UNIT_DEFAULTS.PCS;
      setValue('unitCode', 'PCS');
      setValue('unitOfMeasure', defaults.unitOfMeasure);
      setValue('quantityScale', defaults.quantityScale);
      setValue('allowFraction', defaults.allowFraction);
    } else if (saleTypeWatch === 'PIECE') {
      const defaults = UNIT_DEFAULTS.PCS;
      setValue('unitCode', 'PCS');
      setValue('unitOfMeasure', defaults.unitOfMeasure);
      setValue('quantityScale', defaults.quantityScale);
      setValue('allowFraction', defaults.allowFraction);
    }
  }, [saleTypeWatch, getValues, setValue]);

  useEffect(() => {
    if (saleTypeWatch !== 'WEIGHT') return;
    const defaults = UNIT_DEFAULTS[unitCodeWatch];
    if (!defaults) return;
    setValue('unitOfMeasure', defaults.unitOfMeasure);
    setValue('quantityScale', defaults.quantityScale);
    setValue('allowFraction', defaults.allowFraction);
  }, [unitCodeWatch, saleTypeWatch, setValue]);

  useEffect(() => {
    const next = Number(sellingPriceWatch);
    if (!Number.isFinite(next) || next <= 0) return;
    setStoreRows((rows) =>
      syncStoreRowPrices(rows, next, prevSellingRef.current, costPriceWatch)
    );
    prevSellingRef.current = next;
  }, [sellingPriceWatch, costPriceWatch]);

  const resolveStockStoreId = () => {
    const fromRows = storeRows.map((r) => r.storeId).filter(Boolean);
    if (fromRows.length === 1) return Number(fromRows[0]);
    if (stores?.length === 1) return stores[0].id;
    return null;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ payload, stockQty, isEditMode }) => {
      if (normalizeBusinessTypeCode(payload?.businessTypeCode || effectiveBusinessType) === 'PHARMACY') {
        throw new Error(
          t('products.pharmacyUsePharmStock', {
            defaultValue:
              'Аптечные товары добавляйте в «Склад → Аптечные товары» (/pharm/stock/products)',
          }),
        );
      }
      const res = isEditMode
        ? await productApi.update(product.id, payload)
        : await productApi.create(payload);
      if (isEditMode) {
        const stockStoreId = resolveStockStoreId();
        if (!stockStoreId) {
          throw new Error(t('stockModal.storeRequired'));
        }
        const prev = await productApi
          .getById(product.id, { storeId: stockStoreId })
          .then((r) => r.data.stockQuantity);
        const delta = stockQty - prev;
        if (delta !== 0) {
          await productApi.adjustStock(
            product.id,
            delta,
            'ADJUSTMENT',
            t('productCatalog.stockEditNote'),
            stockStoreId
          );
        }
      }
      return res;
    },
    onSuccess: () => {
      toast.success(isEdit ? t('productModal.updated') : t('productModal.created'));
      onSaved();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('productModal.saveFailed')),
  });

  const showSection = (section) =>
    resolveCatalogSectionVisible(section, {
      productType: productTypeWatch,
      catalogProfile,
    });

  useEffect(() => {
    if (!isRestaurantIngredient || isEdit) return;
    const cost = Number(costPriceWatch);
    if (!Number.isFinite(cost) || cost < 0) return;
    setValue('sellingPrice', cost > 0 ? cost : 0.01, { shouldValidate: true });
  }, [isRestaurantIngredient, isEdit, costPriceWatch, setValue]);

  const onSubmit = (values) => {
    const submitValues = { ...values };
    if (isRestaurantIngredient) {
      submitValues.productType = 'DISH';
      submitValues.ownerType = 'OWN';
      submitValues.taxRate = 0;
      submitValues.defaultDiscountPercent = 0;
      submitValues.soldIndividually = true;
      submitValues.markedProduct = false;
      if (!String(submitValues.sku || '').trim()) {
        const slug = String(submitValues.name || 'ing')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9А-ЯЁ]+/gi, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 16);
        submitValues.sku = `ING-${slug || 'ITEM'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      }
      const cost = Number(submitValues.costPrice) || 0;
      submitValues.sellingPrice = submitValues.sellingPrice > 0
        ? submitValues.sellingPrice
        : (cost > 0 ? cost : 0.01);
    }

    if (
      !isRestaurantIngredient
      && priceRulesConfig.minMarginPercent > 0
      && submitValues.costPrice > 0
      && submitValues.sellingPrice > 0
    ) {
      const margin = ((submitValues.sellingPrice - submitValues.costPrice) / submitValues.costPrice) * 100;
      if (margin < priceRulesConfig.minMarginPercent) {
        toast.error(
          t('productCatalog.minMarginError', { percent: priceRulesConfig.minMarginPercent })
        );
        return;
      }
    }
    if (
      !isRestaurantIngredient
      && submitValues.defaultDiscountPercent > priceRulesConfig.maxDiscountPercent
    ) {
      toast.error(
        t('productCatalog.maxDiscountError', { percent: priceRulesConfig.maxDiscountPercent })
      );
      return;
    }

    const base = buildProductCatalogPayload({
      values: submitValues,
      storeRows: isRestaurantIngredient && selectedStoreId
        ? [{ storeId: String(selectedStoreId), price: String(submitValues.sellingPrice) }]
        : storeRows,
      extraBarcodes: isRestaurantIngredient ? [] : extraBarcodes,
      effectiveBusinessType,
      businessConfigFields: isRestaurantIngredient ? [] : businessConfig?.fields,
      showSection,
    });
    const stockQty = submitValues.initialStock ?? 0;

    if (isEdit) {
      mutate({
        payload: { ...base, active: submitValues.active },
        stockQty,
        isEditMode: true,
      });
    } else {
      mutate({
        payload: { sku: submitValues.sku, initialStock: stockQty, ...base },
        stockQty: 0,
        isEditMode: false,
      });
    }
  };

  return {
    t,
    isEdit,
    catalogProfile,
    showSection,
    register,
    handleSubmit,
    setValue,
    getValues,
    errors,
    onSubmit,
    isPending,
    storeRows,
    setStoreRows,
    extraBarcodes,
    setExtraBarcodes,
    sellingPriceWatch,
    saleTypeWatch,
    productTypeWatch,
    unitCodeWatch,
    ownerTypeWatch,
    taxRateWatch,
    categoryId,
    businessConfig,
    businessConfigLoading,
    priceRulesConfig,
    attributeValues,
    displayRules: businessConfig?.displayRules ?? [],
  };
}
