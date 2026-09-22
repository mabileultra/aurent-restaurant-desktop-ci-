import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { getApiErrorMessage, toastApiError } from '../../../utils/apiError';
import { getUnitConfig, UNIT_DEFAULTS, stockUnitsForSaleType } from '../../../utils/unitConfig';
import { buildFallbackProductSku } from '../utils/buildFallbackProductSku';
import { buildTasnifSku, isAutoTasnifSku } from '../../../utils/tasnifProductIds';

export const INGREDIENT_FORM_EMPTY = {
  name: '',
  categoryId: '',
  productType: 'MATERIAL',
  costPrice: '',
  sellingPrice: '',
  saleType: 'PIECE',
  unitCode: 'PCS',
  lowStockAlert: '10',
  barcode: '',
  ikpu: '',
  packageCode: '',
  unitOfMeasure: 'pcs',
  unitMeasureCode: '',
  externalProductId: '',
  sku: '',
  markedProduct: false,
  receiptQty: '1',
  stockQuantity: '0',
  baselineStockQuantity: '0',
  active: true,
};

export function useIngredientModalForm({
  open,
  product,
  selectedStore,
  defaultProductType = 'MATERIAL',
  mode = 'catalog',
  onClose,
  onSaved,
}) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const isReceipt = mode === 'receipt';
  const { businessType } = useCompanyBusinessType();
  const [form, setForm] = useState({ ...INGREDIENT_FORM_EMPTY, productType: defaultProductType });

  const { data: detail } = useQuery({
    queryKey: ['product', product?.id, selectedStore?.id],
    queryFn: () =>
      productApi
        .getById(product.id, selectedStore?.id != null ? { storeId: selectedStore.id } : undefined)
        .then((r) => r.data),
    enabled: open && isEdit && !!product?.id,
  });

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      setForm({
        ...INGREDIENT_FORM_EMPTY,
        productType: defaultProductType || 'MATERIAL',
        receiptQty: isReceipt ? '1' : '1',
        stockQuantity: '0',
        baselineStockQuantity: '0',
      });
      return;
    }
    const full = detail ?? product;
    if (!full) return;
    const stock = String(full.stockQuantity ?? 0);
    setForm({
      ...INGREDIENT_FORM_EMPTY,
      name: full.name ?? '',
      categoryId: full.categoryId != null ? String(full.categoryId) : '',
      productType: full.productType === 'RETAIL' ? 'RETAIL' : 'MATERIAL',
      costPrice: String(full.costPrice ?? ''),
      sellingPrice: String(full.sellingPrice ?? full.costPrice ?? ''),
      saleType: full.saleType || 'PIECE',
      unitCode: full.unitCode || 'PCS',
      lowStockAlert: String(full.lowStockAlert ?? 10),
      barcode: full.barcode || '',
      ikpu: full.ikpu || '',
      packageCode: full.packageCode || '',
      unitOfMeasure: full.unitOfMeasure || 'pcs',
      unitMeasureCode: full.unitMeasureCode || '',
      externalProductId: full.externalProductId || '',
      sku: full.sku || '',
      markedProduct: !!full.markedProduct,
      receiptQty: '1',
      stockQuantity: stock,
      baselineStockQuantity: stock,
      active: full.active !== false,
    });
  }, [open, isEdit, detail, product, defaultProductType, isReceipt]);

  const unitOptions = useMemo(() => {
    const units = stockUnitsForSaleType(form.saleType);
    return units
      .filter((u) => u?.code)
      .map((u) => ({
        value: u.code,
        label: u.labelRu || u.label || u.code,
      }));
  }, [form.saleType]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const patchForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (form.saleType === 'WEIGHT') {
      const measured = unitOptions.some((u) => u.value === form.unitCode);
      if (!measured) set('unitCode', 'KG');
    } else if (form.unitCode !== 'PCS') {
      set('unitCode', 'PCS');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.saleType]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedStore?.id) throw new Error(t('stockModal.storeRequired'));
      const cost = Number(String(form.costPrice).replace(',', '.')) || 0;
      let selling = Number(String(form.sellingPrice).replace(',', '.'));
      if (!Number.isFinite(selling) || selling <= 0) {
        selling = cost > 0 ? cost : 0.01;
      }
      const resolvedUnit = form.unitCode || 'PCS';
      const unitDefaults = UNIT_DEFAULTS[resolvedUnit] || UNIT_DEFAULTS.PCS;
      const unitCfg = getUnitConfig(resolvedUnit);
      const productType = form.productType === 'RETAIL' ? 'RETAIL' : 'MATERIAL';

      let sku = String(form.sku || '').trim();
      if (!sku) {
        if (form.ikpu) {
          sku = buildTasnifSku(form.ikpu, form.packageCode);
        } else {
          const prefix = productType === 'RETAIL' ? 'PRD' : 'ING';
          sku = buildFallbackProductSku(form.name).replace(/^AUTO-/, `${prefix}-`);
        }
      } else if (!isEdit && form.ikpu && isAutoTasnifSku(sku) && form.packageCode) {
        sku = buildTasnifSku(form.ikpu, form.packageCode);
      }

      const base = {
        name: form.name.trim(),
        categoryId: form.categoryId === '' ? null : Number(form.categoryId),
        costPrice: cost,
        sellingPrice: selling,
        defaultDiscountPercent: 0,
        taxRate: 0,
        productType,
        saleType: form.saleType,
        unitCode: resolvedUnit,
        quantityScale: unitDefaults.quantityScale ?? unitCfg.scale ?? 0,
        allowFraction: unitDefaults.allowFraction ?? false,
        unitOfMeasure: form.unitOfMeasure || unitDefaults.unitOfMeasure || 'pcs',
        unitMeasureCode: form.unitMeasureCode || undefined,
        soldIndividually: true,
        markedProduct: !!form.markedProduct,
        ownerType: 'OWN',
        lowStockAlert: Number(form.lowStockAlert) || 0,
        businessTypeCode: businessType || 'RESTAURANT',
        barcode: form.barcode?.trim() || undefined,
        ikpu: form.ikpu?.trim() || undefined,
        packageCode: form.packageCode?.trim() || undefined,
        externalProductId: form.externalProductId?.trim() || undefined,
        storePrices: [{ storeId: Number(selectedStore.id), price: selling }],
        additionalBarcodes: [],
      };

      if (isEdit) {
        await productApi.update(product.id, { ...base, active: form.active });
        const currentQty = Number(String(form.baselineStockQuantity).replace(',', '.')) || 0;
        const nextQty = Number(String(form.stockQuantity).replace(',', '.'));
        if (Number.isFinite(nextQty) && nextQty !== currentQty && selectedStore?.id != null) {
          const delta = nextQty - currentQty;
          if (delta !== 0) {
            await productApi.adjustStock(
              product.id,
              delta,
              'ADJUSTMENT',
              t('rst.nomenclature.stockAdjustNote'),
              selectedStore.id,
            );
          }
        }
        return productApi
          .getById(product.id, { storeId: selectedStore.id })
          .then((r) => r.data);
      }

      const initialStock = isReceipt
        ? 0
        : Math.max(0, Number(String(form.stockQuantity).replace(',', '.')) || 0);

      const { data } = await productApi.create({
        sku,
        initialStock,
        ...base,
      });
      return data;
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? t('productModal.updated') : t('productModal.created'));
      const receiptMeta = isReceipt && !isEdit
        ? {
          quantity: String(form.receiptQty || '1'),
          purchasePrice: String(form.costPrice || ''),
          unitSellingPrice: String(
            form.sellingPrice
            || form.costPrice
            || saved?.sellingPrice
            || '',
          ),
        }
        : null;
      onSaved?.(saved, receiptMeta);
      onClose();
    },
    onError: (err) => {
      toastApiError(err, getApiErrorMessage(err, t('productModal.saveFailed')));
    },
  });

  const validateAndSubmit = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error(t('validation.nameMin'));
      return;
    }
    if (isReceipt && !isEdit) {
      const qty = Number(String(form.receiptQty).replace(',', '.'));
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error(t('rst.nomenclature.receiptQtyRequired'));
        return;
      }
      const cost = Number(String(form.costPrice).replace(',', '.'));
      if (!Number.isFinite(cost) || cost < 0) {
        toast.error(t('rst.nomenclature.receiptCostRequired'));
        return;
      }
      const sell = Number(String(form.sellingPrice).replace(',', '.'));
      if (!Number.isFinite(sell) || sell <= 0) {
        toast.error(t('rst.nomenclature.receiptPriceRequired'));
        return;
      }
    }
    mutation.mutate();
  };

  return {
    t,
    isEdit,
    isReceipt,
    form,
    set,
    patchForm,
    unitOptions,
    mutation,
    validateAndSubmit,
  };
}
