import { inputCls, ProductCatalogField } from './productCatalogFormUi';

export default function ProductCatalogAccountingSection({
  t,
  register,
  errors,
  template,
  showSection,
  priceRules = null,
}) {
  if (!showSection('accounting')) return null;

  const hideCost = !showSection('accountingCost') || priceRules?.hideCost || template?.hideCost;
  const hideStock = !showSection('accountingStock') || priceRules?.hideInitialStock || template?.hideStock;
  const hideSell = !showSection('accountingSell');
  const hideDiscount = !showSection('accountingDiscount');
  const maxDiscount = priceRules?.maxDiscountPercent ?? 100;
  const priceLabel = template?.priceLabelKey ? t(template.priceLabelKey) : t('productModal.price');
  const stockLabel = template?.stockLabelKey ? t(template.stockLabelKey) : t('productModal.initialStock');
  const stockHint = template?.stockHintKey ? t(template.stockHintKey) : null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionAccounting')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {!hideCost ? (
          <ProductCatalogField
            label={t('productModal.cost')}
            required={priceRules?.requireCost}
            error={errors.costPrice?.message}
          >
            <input
              {...register('costPrice', {
                valueAsNumber: true,
                required: priceRules?.requireCost ? t('validation.costPrice') : false,
              })}
              type="number"
              step="0.01"
              className={inputCls}
            />
          </ProductCatalogField>
        ) : null}
        {!hideSell ? (
          <ProductCatalogField label={priceLabel} error={errors.sellingPrice?.message}>
            <input {...register('sellingPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
          </ProductCatalogField>
        ) : (
          <input type="hidden" {...register('sellingPrice', { valueAsNumber: true })} />
        )}
        {!hideDiscount ? (
          <ProductCatalogField label={t('productCatalog.defaultDiscount')} error={errors.defaultDiscountPercent?.message}>
            <input
              {...register('defaultDiscountPercent', { valueAsNumber: true })}
              type="number"
              min="0"
              max={maxDiscount}
              step="0.1"
              className={inputCls}
            />
          </ProductCatalogField>
        ) : null}
        <ProductCatalogField label={t('productModal.lowStock')} error={errors.lowStockAlert?.message}>
          <input {...register('lowStockAlert', { valueAsNumber: true })} type="number" className={inputCls} />
        </ProductCatalogField>
        {!hideStock ? (
          <ProductCatalogField label={stockLabel} error={errors.initialStock?.message}>
            <input {...register('initialStock', { valueAsNumber: true })} type="number" min="0" step="any" className={inputCls} />
          </ProductCatalogField>
        ) : null}
        <ProductCatalogField label={t('stockModule.modal.location')} error={errors.storageLocation?.message}>
          <input
            {...register('storageLocation')}
            className={inputCls}
            placeholder={t('stockModule.modal.locationPh')}
          />
        </ProductCatalogField>
      </div>
      {priceRules?.minMarginPercent > 0 ? (
        <p className="text-xs text-slate-500">
          {t('productCatalog.minMarginHint', { percent: priceRules.minMarginPercent })}
        </p>
      ) : null}
      {stockHint ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200/90">
          {stockHint}
        </p>
      ) : null}
      <ProductCatalogField label={t('productModal.description')} error={errors.description?.message}>
        <textarea {...register('description')} rows={2} className={`${inputCls} resize-none`} />
      </ProductCatalogField>
    </section>
  );
}
