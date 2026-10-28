import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../../../../components/ui';
import { useStoreFormBusinessTypes } from '../../../../hooks/useStoreFormBusinessTypes';
import RegionDistrictFields from '../../../shared/geo/RegionDistrictFields';
import { buildCompanySelectOptions } from '../../utils/companySelectOptions';
import { formatUzPhone, digitsAfter998, isCompleteUzPhone } from '../../../../utils/phoneUz';
import { normalizeBusinessTypeCode } from '../../../../config/productCatalogConfig';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
  focus:outline-none focus:ring-2 focus:ring-emerald-500
  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function StoreFormModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initial,
  companies = [],
  showCompanySelect = false,
  title,
}) {
  const { t } = useTranslation();

  const isCreate = !initial?.id;
  const schema = useMemo(() => z.object({
    name: z.string().min(1, t('validation.fieldRequired', { field: t('stores.colName') })),
    address: z.string().optional(),
    regionCode: isCreate
      ? z.string().min(1, t('validation.fieldRequired', { field: t('geo.region') }))
      : z.string().optional(),
    districtCode: isCreate
      ? z.string().min(1, t('validation.fieldRequired', { field: t('geo.district') }))
      : z.string().optional(),
    phone: z.string().optional().refine(
      (val) => !val || digitsAfter998(val).length === 0 || isCompleteUzPhone(val),
      {
        message: t('validation.phoneComplete', {
          defaultValue: 'Telefon raqamini to‘liq kiriting (+998 XX XXX-XX-XX)',
        }),
      }
    ),
    code: z.string().optional(),
    companyId: showCompanySelect
      ? z.string().min(1, t('validation.fieldRequired', { field: t('stores.colCompany') }))
      : z.string().optional(),
    businessType: z.string().min(1, t('validation.fieldRequired', { field: t('stores.colBusinessType') })),
    businessTypeId: z.string().optional(),
    active: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    const hasRegion = Boolean(data.regionCode?.trim());
    const hasDistrict = Boolean(data.districtCode?.trim());
    if (hasRegion !== hasDistrict) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasRegion ? ['districtCode'] : ['regionCode'],
        message: t('validation.fieldRequired', { field: hasRegion ? t('geo.district') : t('geo.region') }),
      });
    }
  }), [showCompanySelect, t, isCreate]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { active: true },
  });

  const watchedCompanyId = watch('companyId');
  const watchedBusinessType = watch('businessType');
  const watchedRegionCode = watch('regionCode');
  const watchedDistrictCode = watch('districtCode');
  const watchedPhone = watch('phone');
  const {
    types: companyTypes = [],
    defaultTypeCode,
    isLoading: typesLoading,
    needsCompany,
  } = useStoreFormBusinessTypes(watchedCompanyId, { platformMode: showCompanySelect });

  const prevCompanyRef = useRef('');

  const businessTypeOptions = useMemo(() => {
    if (needsCompany) {
      return [{ value: '', label: t('stores.selectCompanyFirst', { defaultValue: 'Avval kompaniyani tanlang' }) }];
    }
    if (companyTypes.length > 0) {
      return companyTypes.map((bt) => {
        const normCode = normalizeBusinessTypeCode(bt.code);
        return {
          value: bt.code,
          id: bt.id,
          label: t(`productTemplates.businessTypes.${normCode}`, {
            defaultValue: bt.name || bt.code,
          }),
        };
      });
    }
    const normDefault = normalizeBusinessTypeCode(defaultTypeCode);
    return [{
      value: defaultTypeCode,
      id: null,
      label: t(`productTemplates.businessTypes.${normDefault}`, {
        defaultValue: defaultTypeCode,
      }),
    }];
  }, [companyTypes, defaultTypeCode, needsCompany, t]);

  useEffect(() => {
    if (!open || !showCompanySelect) return;

    if (!watchedCompanyId) {
      if (prevCompanyRef.current) {
        setValue('businessType', '');
        setValue('businessTypeId', '');
      }
      prevCompanyRef.current = '';
      return;
    }

    const companyChanged = prevCompanyRef.current !== watchedCompanyId;
    if (companyChanged) {
      prevCompanyRef.current = watchedCompanyId;
      setValue('businessType', '');
      setValue('businessTypeId', '');
    }

    if (typesLoading || companyTypes.length === 0) return;

    const validForCompany = companyTypes.some((bt) => bt.code === watchedBusinessType);
    if (validForCompany && watchedBusinessType) return;

    const defaultType = companyTypes.find((bt) => bt.defaultType) ?? companyTypes[0];
    setValue('businessType', defaultType.code);
    setValue('businessTypeId', String(defaultType.id));
  }, [
    open,
    showCompanySelect,
    watchedCompanyId,
    watchedBusinessType,
    companyTypes,
    typesLoading,
    setValue,
  ]);

  useEffect(() => {
    if (!open) {
      prevCompanyRef.current = '';
      return;
    }
    reset({
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      regionCode: initial?.regionCode ?? '',
      districtCode: initial?.districtCode ?? '',
      phone: initial?.phone && digitsAfter998(initial.phone) ? formatUzPhone(initial.phone) : '',
      code: initial?.code ?? '',
      companyId: initial?.companyId ? String(initial.companyId) : '',
      businessType: initial?.businessType ?? '',
      businessTypeId: initial?.businessTypeId ? String(initial.businessTypeId) : '',
      active: initial?.active ?? true,
    });
  }, [open, initial?.id, reset]);

  if (!open) return null;

  const handleFormSubmit = (data) => {
    const regionCode = data.regionCode?.trim() || '';
    const districtCode = data.districtCode?.trim() || '';
    const phoneDigits = digitsAfter998(data.phone);
    const payload = {
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phone: phoneDigits ? formatUzPhone(data.phone) : null,
      code: data.code?.trim() || null,
      companyId: data.companyId ? Number(data.companyId) : undefined,
      businessType: data.businessType,
      businessTypeId: data.businessTypeId ? Number(data.businessTypeId) : undefined,
      active: data.active,
    };
    if (regionCode && districtCode) {
      payload.regionCode = regionCode;
      payload.districtCode = districtCode;
    } else if (isCreate) {
      payload.regionCode = regionCode;
      payload.districtCode = districtCode;
    }
    onSubmit(payload);
  };

  const modalTitle = title ?? (initial?.id ? t('stores.editTitle') : (showCompanySelect ? t('platform.addBranch', { defaultValue: 'Filial qo‘shish' }) : t('stores.addTitle')));

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{modalTitle}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-5">
          {showCompanySelect ? (
            <>
              <input type="hidden" {...register('companyId')} />
              <BaseSelect
              label={t('stores.colCompany')}
              required
              value={watchedCompanyId ?? ''}
              onChange={(e) => setValue('companyId', e.target.value, { shouldValidate: true })}
              error={errors.companyId?.message}
              placeholder={t('stores.selectCompany')}
              searchPlaceholder={t('stores.searchCompany', { defaultValue: 'Поиск компании…' })}
              options={buildCompanySelectOptions(companies, { emptyLabel: t('stores.selectCompany') })}
            />
            </>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colName')} *</label>
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
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colAddress')}</label>
            <textarea {...register('address')} rows={2} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colPhone')}</label>
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
            {t('stores.activeLabel')}
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending}
              className="admin-btn-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm">
              {isPending && <Loader size={14} className="animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
