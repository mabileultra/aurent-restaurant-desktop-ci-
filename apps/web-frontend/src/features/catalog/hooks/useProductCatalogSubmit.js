import toast from 'react-hot-toast';
import { buildProductCatalogPayload } from '../utils/buildProductCatalogPayload';
import {
  isDiscountExceeded,
  prepareProductCatalogSubmitValues,
} from '../utils/productCatalogSubmitHelper';
import { useProductCatalogMutation } from './useProductCatalogMutation';

export function useProductCatalogSubmit({
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
}) {
  const { mutate, isPending } = useProductCatalogMutation({
    product,
    isEdit,
    effectiveBusinessType,
    stores,
    selectedStoreId,
    onSaved,
    t,
  });

  const onSubmit = (values) => {
    const submitValues = prepareProductCatalogSubmitValues(values, {
      isRestaurantIngredient,
      showSection,
    });

    if (
      isDiscountExceeded(submitValues, {
        isRestaurantIngredient,
        showSection,
        maxDiscountPercent: priceRulesConfig?.maxDiscountPercent,
      })
    ) {
      toast.error(
        t('productCatalog.maxDiscountError', { percent: priceRulesConfig.maxDiscountPercent })
      );
      return;
    }

    const base = buildProductCatalogPayload({
      values: submitValues,
      storeRows:
        isRestaurantIngredient && selectedStoreId
          ? [{ storeId: String(selectedStoreId), price: String(submitValues.sellingPrice) }]
          : storeRows,
      extraBarcodes: isRestaurantIngredient ? [] : extraBarcodes,
      effectiveBusinessType,
      businessConfigFields: isRestaurantIngredient ? [] : businessConfig?.fields,
      showSection,
      selectedStoreId,
      stores,
    });
    const trackStock = showSection('accounting') && showSection('accountingStock');
    const stockQty = trackStock ? (submitValues.initialStock ?? 0) : 0;

    if (isEdit) {
      mutate({
        payload: {
          ...base,
          active: showSection('activeField') ? submitValues.active : true,
        },
        stockQty: trackStock ? stockQty : null,
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

  return { onSubmit, isPending };
}
