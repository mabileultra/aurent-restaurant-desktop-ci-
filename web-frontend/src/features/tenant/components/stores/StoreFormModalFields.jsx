import React from 'react';
import { BaseSelect } from '../../../../components/ui';
import RegionDistrictFields from '../../../shared/geo/RegionDistrictFields';
import { buildCompanySelectOptions } from '../../utils/companySelectOptions';
import { formatUzPhone, digitsAfter998 } from '../../../../utils/phoneUz';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
  focus:outline-none focus:ring-2 focus:ring-emerald-500
  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function StoreFormModalFields({
  t,
  showCompanySelect,
  companies,
  register,
  errors,
  setValue,
  watchedCompanyId,
  watchedBusinessType,
  watchedRegionCode,
  watchedDistrictCode,
  watchedPhone,
  typesLoading,
  needsCompany,
  businessTypeOptions,
  isCreate,
}) {
  return (
    <>
      {showCompanySelect ? (
        <>
          <input type="hidden" {...register('companyId')} />
          <BaseSelect
            label={t('stores.colCompany')}
            required
            disabled={!isCreate}
            value={watchedCompanyId ?? ''}
            onChange={(e) => {
              const compId = e.target.value;
              setValue('companyId', compId, { shouldValidate: true });
              const found = companies.find((c) => String(c.id) === String(compId));
              if (found?.regionCode && !watchedRegionCode) {
                setValue('regionCode', found.regionCode, { shouldValidate: true });
                setValue('districtCode', found.districtCode || '', { shouldValidate: true });
              }
            }}
            error={errors.companyId?.message}
            placeholder={t('stores.selectCompany')}
            searchPlaceholder={t('stores.searchCompany', { defaultValue: 'Поиск компании…' })}
            options={buildCompanySelectOptions(companies, { emptyLabel: t('stores.selectCompany') })}
            helperText={!isCreate ? t('platform.branchCompanyLocked', { defaultValue: 'Tahrirlashda filial kompaniyasini o‘zgartirib bo‘lmaydi' }) : undefined}
          />
        </>
      ) : null}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('stores.colName')} *
        </label>
        <input {...register('name')} className={inputCls} />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div>
        <input type="hidden" {...register('businessTypeId')} />
        <BaseSelect
          label={t('stores.colBusinessType')}
          required
          disabled={typesLoading || needsCompany}
          value={watchedBusinessType ?? ''}
          onChange={(e) => {
            const next = e.target.value;
            setValue('businessType', next, { shouldValidate: true });
            const selected = businessTypeOptions.find((o) => o.value === next);
            if (selected?.id) {
              setValue('businessTypeId', String(selected.id));
            }
          }}
          error={errors.businessType?.message}
          placeholder={needsCompany ? t('stores.selectCompanyFirst') : undefined}
          options={businessTypeOptions.map((bt) => ({
            value: bt.value,
            label: bt.label,
            disabled: !bt.value,
          }))}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('stores.businessTypeHint')}</p>
      </div>
      <input type="hidden" {...register('regionCode')} />
      <input type="hidden" {...register('districtCode')} />
      <RegionDistrictFields
        regionCode={watchedRegionCode}
        districtCode={watchedDistrictCode}
        required={isCreate}
        regionError={errors.regionCode?.message}
        districtError={errors.districtCode?.message}
        onChange={({ regionCode, districtCode }) => {
          setValue('regionCode', regionCode, { shouldValidate: true });
          setValue('districtCode', districtCode, { shouldValidate: true });
        }}
      />
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('stores.colAddress')}
        </label>
        <textarea {...register('address')} rows={2} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('stores.colPhone')}
        </label>
        <input
          {...register('phone')}
          type="tel"
          inputMode="tel"
          maxLength={19}
          value={watchedPhone ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            const digits = digitsAfter998(val);
            const next = digits ? formatUzPhone(val) : '';
            setValue('phone', next, { shouldValidate: true });
          }}
          placeholder="+998 (90) 123-45-67"
          className={inputCls}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" {...register('active')} className="rounded border-slate-300" />
        {showCompanySelect
          ? t('platform.branchActive', { defaultValue: 'Filial faol' })
          : t('stores.activeLabel')}
      </label>
    </>
  );
}
