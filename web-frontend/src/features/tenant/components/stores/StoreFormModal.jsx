import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStoreFormBusinessTypes } from '../../../../hooks/useStoreFormBusinessTypes';
import { formatUzPhone, digitsAfter998 } from '../../../../utils/phoneUz';
import { normalizeBusinessTypeCode } from '../../../../config/productCatalogConfig';
import { useOnlineActionGuard } from '../../../../hooks/useOnlineActionGuard';
import { useFormDraft } from '../../../../hooks/useFormDraft';
import StoreFormModalFields from './StoreFormModalFields';
import { buildStoreFormSchema, buildStoreSubmitPayload } from './storeFormSchema';

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
  const { isActionBlocked, blockReason } = useOnlineActionGuard();
  const isCreate = !initial?.id;

  const schema = useMemo(
    () => buildStoreFormSchema(t, { isCreate, showCompanySelect }),
    [t, isCreate, showCompanySelect]
  );

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { active: true },
  });

  const watchedValues = watch();
  const watchedCompanyId = watch('companyId');
  const watchedBusinessType = watch('businessType');
  const watchedRegionCode = watch('regionCode');
  const watchedDistrictCode = watch('districtCode');
  const watchedPhone = watch('phone');

  const { clearDraft } = useFormDraft('tenant_store_create', isCreate && open ? watchedValues : null, (saved) => {
    if (saved && isCreate) {
      Object.entries(saved).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') setValue(k, v);
      });
    }
  });

  const { types: companyTypes = [], defaultTypeCode, isLoading: typesLoading, needsCompany } = useStoreFormBusinessTypes(
    watchedCompanyId,
    { platformMode: showCompanySelect }
  );

  const prevCompanyRef = useRef('');

  const businessTypeOptions = useMemo(() => {
    if (needsCompany) {
      return [{ value: '', label: t('stores.selectCompanyFirst', { defaultValue: 'Avval kompaniyani tanlang' }) }];
    }
    if (companyTypes.length > 0) {
      return companyTypes.map((bt) => ({
        value: bt.code,
        id: bt.id,
        label: t(`productTemplates.businessTypes.${normalizeBusinessTypeCode(bt.code)}`, { defaultValue: bt.name || bt.code }),
      }));
    }
    const normDefault = normalizeBusinessTypeCode(defaultTypeCode);
    return [{
      value: defaultTypeCode,
      id: null,
      label: t(`productTemplates.businessTypes.${normDefault}`, { defaultValue: defaultTypeCode }),
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
    if (prevCompanyRef.current !== watchedCompanyId) {
      prevCompanyRef.current = watchedCompanyId;
      setValue('businessType', '');
      setValue('businessTypeId', '');
    }
    if (typesLoading || companyTypes.length === 0) return;
    const valid = companyTypes.some((bt) => bt.code === watchedBusinessType);
    if (valid && watchedBusinessType) return;
    const defaultType = companyTypes.find((bt) => bt.defaultType) ?? companyTypes[0];
    setValue('businessType', defaultType.code);
    setValue('businessTypeId', String(defaultType.id));
  }, [open, showCompanySelect, watchedCompanyId, watchedBusinessType, companyTypes, typesLoading, setValue]);

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
    onSubmit(buildStoreSubmitPayload(data, isCreate));
    clearDraft();
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
          <StoreFormModalFields
            t={t}
            showCompanySelect={showCompanySelect}
            companies={companies}
            register={register}
            errors={errors}
            setValue={setValue}
            watchedCompanyId={watchedCompanyId}
            watchedBusinessType={watchedBusinessType}
            watchedRegionCode={watchedRegionCode}
            watchedDistrictCode={watchedDistrictCode}
            watchedPhone={watchedPhone}
            typesLoading={typesLoading}
            needsCompany={needsCompany}
            businessTypeOptions={businessTypeOptions}
            isCreate={isCreate}
          />
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || isActionBlocked}
              title={isActionBlocked ? blockReason : undefined}
              className="admin-btn-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && <Loader size={14} className="animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(modalContent, document.body) : modalContent;
}
