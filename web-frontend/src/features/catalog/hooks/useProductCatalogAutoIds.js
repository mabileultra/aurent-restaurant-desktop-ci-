import { useEffect } from 'react';
import {
  buildTasnifExternalId,
  buildTasnifSku,
  isAutoTasnifExternalId,
  isAutoTasnifSku,
} from '../../../utils/tasnifProductIds';

/**
 * Автозаполнение ID товара и SKU из ИКПУ + кода упаковки (создание товара).
 * Не перезаписывает вручную заданные значения.
 */
export function useProductCatalogAutoIds({ isEdit, ikpuWatch, packageCodeWatch, getValues, setValue }) {
  useEffect(() => {
    if (isEdit) return;
    const mxik = String(ikpuWatch || '').trim();
    if (!mxik) return;

    const packageCode = String(packageCodeWatch || '').trim();
    const nextExtId = buildTasnifExternalId(mxik, packageCode);
    const currentExtId = getValues('externalProductId');
    if (isAutoTasnifExternalId(currentExtId, mxik)) {
      setValue('externalProductId', nextExtId, { shouldDirty: true });
    }

    const nextSku = buildTasnifSku(mxik, packageCode);
    const currentSku = getValues('sku');
    if (!currentSku?.trim() || isAutoTasnifSku(currentSku)) {
      setValue('sku', nextSku, { shouldDirty: true, shouldValidate: true });
    }
  }, [isEdit, ikpuWatch, packageCodeWatch, getValues, setValue]);
}
