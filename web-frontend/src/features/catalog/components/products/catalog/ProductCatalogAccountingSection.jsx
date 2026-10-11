import { inputCls, ProductCatalogField } from './productCatalogFormUi';
import './product-catalog-form-fields.css';

function FieldSlot({ hidden, children }) {
  if (hidden) return null;
  return children;
}

function visibleCount(...flags) {
  return flags.filter(Boolean).length;
}

export default function ProductCatalogAccountingSection({
  t,
  register,
  errors,
  template,
  showSection,
  priceRules = null,
  storePricesEnabled = false,
}) {
  if (!showSection('accounting')) return null;

  const hideCost = !showSection('accountingCost') || priceRules?.hideCost || template?.hideCost;
  const hideStock = !showSection('accountingStock') || priceRules?.hideInitialStock || template?.hideStock;
  const hideSell = !showSection('accountingSell');
  const hideDiscount = !showSection('accountingDiscount');
  const hideLowStock = !showSection('accountingLowStock');
  const hideLocation = !showSection('accountingLocation');
  const maxDiscount = priceRules?.maxDiscountPercent ?? 100;
  const priceLabel = template?.priceLabelKey
    ? t(template.priceLabelKey)
    : t('productCatalog.retailPrice');
  const stockLabel = template?.stockLabelKey ? t(template.stockLabelKey) : t('productModal.initialStock');
  const stockHint = template?.stockHintKey ? t(template.stockHintKey) : null;

  const showStockRow = !hideLowStock || !hideStock || !hideLocation;
  const showPriceRow = !hideCost || !hideSell || !hideDiscount;
  const stockCols = visibleCount(!hideLowStock, !hideStock, !hideLocation);
  const priceCols = visibleCount(!hideCost, !hideSell, !hideDiscount);
  const stockGridClass =
    stockCols >= 3
      ? 'product-catalog-form-grid product-catalog-form-grid--auto-3'
      : 'product-catalog-form-grid product-catalog-form-grid--auto-2';
  const priceGridClass =
    priceCols >= 3
      ? 'product-catalog-form-grid product-catalog-form-grid--auto-3'
      : 'product-catalog-form-grid product-catalog-form-grid--auto-2';

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionAccounting')}
      </h3>

      {showStockRow ? (
        <div className={stockGridClass}>
          <FieldSlot hidden={hideLowStock}>
            <ProductCatalogField label={t('productModal.lowStock')} error={errors.lowStockAlert?.message}>
              <input
                {...register('lowStockAlert', { valueAsNumber: true })}
                type="number"
                className={inputCls}
                onFocus={(e) => e.currentTarget.select()}
              />
            </ProductCatalogField>
          </FieldSlot>
          {hideLowStock ? <input type="hidden" {...register('lowStockAlert', { valueAsNumber: true })} /> : null}

          <FieldSlot hidden={hideStock}>
            <ProductCatalogField label={stockLabel} error={errors.initialStock?.message}>
              <input
                {...register('initialStock', { valueAsNumber: true })}
                type="number"
                min="0"
                step="any"
                className={inputCls}
                onFocus={(e) => e.currentTarget.select()}
              />
            </ProductCatalogField>
          </FieldSlot>

          <FieldSlot hidden={hideLocation}>
            <ProductCatalogField label={t('stockModule.modal.location')} error={errors.storageLocation?.message}>
              <input
                {...register('storageLocation')}
                className={inputCls}
                placeholder={t('stockModule.modal.locationPh')}
              />
            </ProductCatalogField>
          </FieldSlot>
          {hideLocation ? <input type="hidden" {...register('storageLocation')} /> : null}
        </div>
      ) : (
        <>
          <input type="hidden" {...register('lowStockAlert', { valueAsNumber: true })} />
          <input type="hidden" {...register('storageLocation')} />
        </>
      )}

      {showPriceRow ? (
        <div className={priceGridClass}>
          <FieldSlot hidden={hideCost}>
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
          </FieldSlot>

          <FieldSlot hidden={hideSell}>
            <ProductCatalogField
              label={priceLabel}
              required
              error={errors.sellingPrice?.message}
              hint={
                storePricesEnabled
                  ? t('productCatalog.retailPriceWithStoresHint')
                  : t('productCatalog.retailPriceDefaultHint')
              }
            >
              <input {...register('sellingPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
            </ProductCatalogField>
          </FieldSlot>
          {hideSell ? <input type="hidden" {...register('sellingPrice', { valueAsNumber: true })} /> : null}

          <FieldSlot hidden={hideDiscount}>
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
          </FieldSlot>
        </div>
      ) : (
        <input type="hidden" {...register('sellingPrice', { valueAsNumber: true })} />
      )}

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
    </section>
  );
}
