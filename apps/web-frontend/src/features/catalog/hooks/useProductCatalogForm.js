import { useMemo, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api';
import {
  CATALOG_PROFILE_RESTAURANT_INGREDIENT,
  normalizeBusinessTypeCode,
  resolveCatalogSectionVisible,
} from '../../../config/productCatalogConfig';
import { formFieldsToSectionMap } from '../../../config/productCatalogFormFields';
import useBusinessConfig from '../../../hooks/useBusinessConfig';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { defaultProductCatalogFormValues } from '../utils/productCatalogFormDefaults';
import { createProductCatalogFormSchema } from '../utils/productCatalogFormSchema';
import { extractAttributeValues, parsePriceRules } from '../../../utils/businessConfigUtils';
import { useProductCatalogAutoIds } from './useProductCatalogAutoIds';
import { useProductCatalogHydration } from './useProductCatalogHydration';
import { useProductCatalogUnitSync } from './useProductCatalogUnitSync';
import { useProductCatalogSubmit } from './useProductCatalogSubmit';

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

  const formSectionMap = useMemo(
    () => formFieldsToSectionMap(businessConfig?.formFields),
    [businessConfig?.formFields]
  );

  useEffect(() => {
    if (isEdit || !selectedStoreId) return;
    if (formSectionMap.storePrices === false) return;
    setStoreRows((rows) => {
      if (rows.length === 1 && !rows[0].storeId) {
        return [{ storeId: String(selectedStoreId), price: rows[0].price ?? '' }];
      }
      return rows.map((row, idx) => (
        idx === 0 ? { ...row, storeId: String(selectedStoreId) } : row
      ));
    });
  }, [selectedStoreId, isEdit, formSectionMap.storePrices]);

  const schema = useMemo(
    () => createProductCatalogFormSchema(t, {
      catalogProfile,
      skuOptional: formSectionMap.skuField === false,
    }),
    [t, catalogProfile, formSectionMap.skuField],
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

  useProductCatalogHydration({
    isEdit,
    full,
    detail,
    businessConfig,
    reset,
    setValue,
    setStoreRows,
    setExtraBarcodes,
    prevSellingRef,
  });

  const sellingPriceWatch = watch('sellingPrice');
  const costPriceWatch = watch('costPrice');
  const saleTypeWatch = watch('saleType');
  const productTypeWatch = watch('productType');
  const unitCodeWatch = watch('unitCode');
  const ownerTypeWatch = watch('ownerType');
  const taxRateWatch = watch('taxRate');
  const categoryId = watch('categoryId');
  const ikpuWatch = watch('ikpu');
  const packageCodeWatch = watch('packageCode');

  useProductCatalogAutoIds({
    isEdit,
    ikpuWatch,
    packageCodeWatch,
    getValues,
    setValue,
  });

  useProductCatalogUnitSync({
    saleTypeWatch,
    unitCodeWatch,
    sellingPriceWatch,
    costPriceWatch,
    isRestaurantIngredient,
    isEdit,
    formSectionMap,
    prevSellingRef,
    setStoreRows,
    getValues,
    setValue,
  });

  const showSection = (section) =>
    resolveCatalogSectionVisible(section, {
      productType: productTypeWatch,
      catalogProfile,
      formSectionMap,
    });

  const { onSubmit, isPending } = useProductCatalogSubmit({
    product,
    isEdit,
    effectiveBusinessType,
    stores,
    selectedStoreId,
    onSaved,
    t,
    isRestaurantIngredient,
    showSection,
    priceRulesConfig,
    storeRows,
    extraBarcodes,
    businessConfig,
  });

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
