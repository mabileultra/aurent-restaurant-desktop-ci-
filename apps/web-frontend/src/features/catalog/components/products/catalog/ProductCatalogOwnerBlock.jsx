import { BaseSelect } from '../../../../../components/ui';
import {
  inputCls,
  OWNER_TYPES,
  ProductCatalogField,
  VAT_OPTIONS,
} from './productCatalogFormUi';

export default function ProductCatalogOwnerBlock({
  t,
  register,
  errors,
  setValue,
  showSection,
  ownerTypeWatch,
  taxRateWatch,
}) {
  const showOwnerType = showSection('ownerType');
  const showVat = showSection('vatField');
  const showCommissionTin = showSection('commissionTin');
  const showCommissionPinfl = showSection('commissionPinfl');
  const showOwnerBlock = showOwnerType || showVat || showCommissionTin || showCommissionPinfl;

  if (!showOwnerBlock) return null;

  return (
    <div className="product-catalog-form-grid">
      {showOwnerType ? (
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
      ) : (
        <input type="hidden" {...register('ownerType')} />
      )}
      {showVat ? (
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
      ) : (
        <input type="hidden" {...register('taxRate', { valueAsNumber: true })} />
      )}
      {showCommissionTin ? (
        <ProductCatalogField label={t('productCatalog.commissionTin')} error={errors.commissionTin?.message}>
          <input {...register('commissionTin')} maxLength={9} className={inputCls} />
        </ProductCatalogField>
      ) : (
        <input type="hidden" {...register('commissionTin')} />
      )}
      {showCommissionPinfl ? (
        <ProductCatalogField label={t('productCatalog.commissionPinfl')} error={errors.commissionPinfl?.message}>
          <input {...register('commissionPinfl')} maxLength={14} className={inputCls} />
        </ProductCatalogField>
      ) : (
        <input type="hidden" {...register('commissionPinfl')} />
      )}
    </div>
  );
}
