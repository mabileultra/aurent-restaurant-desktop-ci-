import { useEffect } from 'react';
import { getStockUnits, UNIT_DEFAULTS } from '../../../utils/unitConfig';
import { syncStoreRowPrices } from '../../../utils/productCatalogPrices';

export function useProductCatalogUnitSync({
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
}) {
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
    } else if (saleTypeWatch === 'SERVICE' || saleTypeWatch === 'PIECE') {
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
    if (formSectionMap.storePrices === false) return;
    const next = Number(sellingPriceWatch);
    if (!Number.isFinite(next) || next <= 0) return;
    setStoreRows((rows) =>
      syncStoreRowPrices(rows, next, prevSellingRef.current, costPriceWatch)
    );
    prevSellingRef.current = next;
  }, [sellingPriceWatch, costPriceWatch, formSectionMap.storePrices, prevSellingRef, setStoreRows]);

  useEffect(() => {
    if (!isRestaurantIngredient || isEdit) return;
    const cost = Number(costPriceWatch);
    if (!Number.isFinite(cost) || cost < 0) return;
    setValue('sellingPrice', cost > 0 ? cost : 0.01, { shouldValidate: true });
  }, [isRestaurantIngredient, isEdit, costPriceWatch, setValue]);
}
