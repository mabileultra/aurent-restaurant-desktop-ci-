import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productApi, storeApi } from '../../../api';
import { normalizeBusinessTypeCode } from '../../../config/productCatalogConfig';
import { planCatalogStockDeltas } from '../utils/planCatalogStockDeltas';

export function useProductCatalogMutation({
  product,
  isEdit,
  effectiveBusinessType,
  stores,
  selectedStoreId,
  onSaved,
  t,
}) {
  return useMutation({
    mutationFn: async ({ payload, stockQty, isEditMode }) => {
      if (normalizeBusinessTypeCode(payload?.businessTypeCode || effectiveBusinessType) === 'PHARMACY') {
        throw new Error(
          t('products.pharmacyUsePharmStock', {
            defaultValue: 'Аптечные товары добавляйте в приложении аптеки (p-aurent)',
          }),
        );
      }
      const res = isEditMode
        ? await productApi.update(product.id, payload)
        : await productApi.create(payload);
      if (isEditMode && stockQty != null && Number.isFinite(Number(stockQty))) {
        const listed = await storeApi.getAll()
          .then((r) => (Array.isArray(r.data) ? r.data : r.data?.content ?? []))
          .catch(() => []);
        let storeIds = listed.map((s) => s?.id).filter((id) => id != null && id !== '');
        if (!storeIds.length) {
          storeIds = (stores || []).map((s) => s?.id).filter((id) => id != null && id !== '');
        }
        if (!storeIds.length) {
          throw new Error(t('stockModal.storeRequired'));
        }
        const company = await productApi.getById(product.id).then((r) => r.data);
        const companyTotal = Number(company?.stockQuantity) || 0;
        const quantitiesByStore = {};
        await Promise.all(storeIds.map(async (id) => {
          const qty = await productApi
            .getById(product.id, { storeId: id })
            .then((r) => Number(r.data?.stockQuantity) || 0);
          quantitiesByStore[id] = qty;
        }));
        const known = Object.values(quantitiesByStore).reduce((sum, qty) => sum + qty, 0);
        const preferred = selectedStoreId ?? storeIds[0];
        const gap = Math.round((companyTotal - known) * 1000) / 1000;
        if (gap !== 0) {
          quantitiesByStore[preferred] = (Number(quantitiesByStore[preferred]) || 0) + gap;
        }
        const plans = planCatalogStockDeltas({
          desiredTotal: stockQty,
          quantitiesByStore,
          preferredStoreId: preferred,
        });
        for (const plan of plans) {
          await productApi.adjustStock(
            product.id,
            plan.delta,
            'ADJUSTMENT',
            t('productCatalog.stockEditNote'),
            plan.storeId
          );
        }
      }
      return res;
    },
    onSuccess: () => {
      toast.success(isEdit ? t('productModal.updated') : t('productModal.created'));
      onSaved();
    },
    onError: (err) => toast.error(
      err.response?.data?.message
      ?? (err.response ? t('productModal.saveFailed') : err.message)
      ?? t('productModal.saveFailed')
    ),
  });
}
