import { useMemo } from 'react';
import { BaseSelect } from '../../../../../components/ui';
import { stockUnitsForSaleType } from '../../../../../utils/unitConfig';
import {
  inputCls,
  OWNER_TYPES,
  ProductCatalogField,
  VAT_OPTIONS,
} from './productCatalogFormUi';

export default function ProductCatalogGeneralSection({
  t,
  register,
  errors,
  categories,
  isEdit,
  saleTypeWatch,
  productTypeWatch,
  unitCodeWatch,
  ownerTypeWatch,
  taxRateWatch,
  categoryId,
  setValue,
  showSection,
  configUnits = null,
}) {
  const showTypeSelectors = showSection('typeSelectors');
  const showRetailFlags = showSection('retailFlags');
  const showOwnerVat = showSection('ownerVat');
  const unitOptions = useMemo(() => {
    const base = stockUnitsForSaleType(saleTypeWatch);
    if (!configUnits?.length) return base;
    const allowed = new Set(configUnits.map((u) => u.code));
    return base.filter((u) => allowed.has(u.code));
  }, [saleTypeWatch, configUnits]);

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('productCatalog.sectionGeneral')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {showSection('skuField') ? (
          <ProductCatalogField label={t('productModal.sku')} required error={errors.sku?.message}>
            <input {...register('sku')} disabled={isEdit} className={inputCls} />
          </ProductCatalogField>
        ) : (
          <input type="hidden" {...register('sku')} />
        )}
        <ProductCatalogField label={t('productModal.name')} required error={errors.name?.message}>
          <input {...register('name')} className={inputCls} />
        </ProductCatalogField>
        <ProductCatalogField label={t('productModal.category')} error={errors.categoryId?.message}>
          <BaseSelect
            name="categoryId"
            value={categoryId ?? ''}
            onChange={(e) => setValue('categoryId', e.target.value, { shouldDirty: true, shouldValidate: true })}
            placeholder={t('productModal.noneCategory')}
            options={[
              { value: '', label: t('productModal.noneCategory') },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
        </ProductCatalogField>
        {showTypeSelectors ? (
          <>
            {isEdit && showSection('productTypeField') ? (
              <ProductCatalogField label={t('productCatalog.productType')} required error={errors.productType?.message}>
                <BaseSelect
                  name="productType"
                  value={productTypeWatch ?? 'RETAIL'}
                  onChange={(e) =>
                    setValue('productType', e.target.value, { shouldDirty: true, shouldValidate: true })
                  }
                  options={[
                    { value: 'RETAIL', label: t('productCatalog.productTypeRetail') },
                    { value: 'MATERIAL', label: t('productCatalog.productTypeMaterial') },
                    { value: 'DISH', label: t('productCatalog.productTypeDish') },
                    { value: 'SERVICE', label: t('productCatalog.productTypeService') },
                  ]}
                />
              </ProductCatalogField>
            ) : null}
            <ProductCatalogField label={t('productCatalog.saleType')} required error={errors.saleType?.message}>
              <BaseSelect
                name="saleType"
                value={saleTypeWatch ?? 'PIECE'}
                onChange={(e) =>
                  setValue('saleType', e.target.value, { shouldDirty: true, shouldValidate: true })
                }
                options={[
                  { value: 'PIECE', label: t('productCatalog.saleTypePiece') },
                  { value: 'WEIGHT', label: t('productCatalog.saleTypeWeight') },
                  ...(showSection('productTypeField')
                    ? [{ value: 'SERVICE', label: t('productCatalog.saleTypeService') }]
                    : []),
                ]}
              />
            </ProductCatalogField>
            <ProductCatalogField label={t('productCatalog.unitCode')} required error={errors.unitCode?.message}>
              <BaseSelect
                name="unitCode"
                value={unitCodeWatch ?? 'PCS'}
                onChange={(e) =>
                  setValue('unitCode', e.target.value, { shouldDirty: true, shouldValidate: true })
                }
                options={unitOptions.map((u) => ({
                  value: u.code,
                  label: u.labelRu ? `${u.label} — ${u.labelRu}` : u.label,
                }))}
              />
            </ProductCatalogField>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-6">
        {showRetailFlags ? (
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" {...register('soldIndividually')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.soldByPiece')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" {...register('markedProduct')} className="rounded border-slate-400 dark:border-slate-600" />
              {t('productCatalog.marked')}
            </label>
          </>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" {...register('active')} className="rounded border-slate-400 dark:border-slate-600" />
          {t('productCatalog.active')}
        </label>
      </div>
      {showOwnerVat ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ProductCatalogField label={t('productCatalog.ownerType')} required error={errors.ownerType?.message}>
            <BaseSelect
              name="ownerType"
              value={ownerTypeWatch ?? 'OWN'}
              onChange={(e) =>
                setValue('ownerType', e.target.value, { shouldDirty: true, shouldValidate: true })
              }
              options={OWNER_TYPES.map((o) => ({
                value: o,
                label: t(`productCatalog.owner.${o}`, o),
              }))}
            />
          </ProductCatalogField>
          <ProductCatalogField label={t('productCatalog.vat')} error={errors.taxRate?.message}>
            <BaseSelect
              name="taxRate"
              value={String(taxRateWatch ?? 0)}
              onChange={(e) =>
                setValue('taxRate', Number(e.target.value), { shouldDirty: true, shouldValidate: true })
              }
              options={VAT_OPTIONS.map((v) => ({
                value: String(v),
                label: `${v}%`,
              }))}
            />
          </ProductCatalogField>
          <ProductCatalogField label={t('productCatalog.commissionTin')} error={errors.commissionTin?.message}>
            <input {...register('commissionTin')} maxLength={9} className={inputCls} />
          </ProductCatalogField>
          <ProductCatalogField label={t('productCatalog.commissionPinfl')} error={errors.commissionPinfl?.message}>
            <input {...register('commissionPinfl')} maxLength={14} className={inputCls} />
          </ProductCatalogField>
        </div>
      ) : null}
    </section>
  );
}
