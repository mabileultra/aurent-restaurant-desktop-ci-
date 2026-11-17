import React from 'react';
import UnitConversionHelper from '../../../components/shared/UnitConversionHelper';
import { getProductLengthM } from '../../../utils/productAttributes';
import { inputCls, labelCls } from './WarehouseReceiveFormFields';

export default function WarehouseReceiveQtyField({
  quantity,
  setQuantity,
  selectedProduct,
  unitCode,
  unitConfig,
  t,
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:items-center">
      <label className={labelCls}>
        <span className="text-red-600">*</span> {t('stockModule.modal.qty')}
      </label>
      <div>
        <input
          className={inputCls}
          inputMode="decimal"
          placeholder={t('stockModule.modal.qtyPh')}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        {selectedProduct ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('stockModule.modal.qtyUnitHint', { unit: unitConfig.label })}
          </p>
        ) : null}
        {selectedProduct ? (
          <UnitConversionHelper
            t={t}
            stockUnitCode={unitCode}
            standardLength={getProductLengthM(selectedProduct)}
            onApplyStockQty={(qty) => setQuantity(String(qty))}
          />
        ) : null}
      </div>
    </div>
  );
}
