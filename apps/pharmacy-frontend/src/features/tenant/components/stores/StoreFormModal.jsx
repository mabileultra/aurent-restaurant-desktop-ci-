import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseModal } from '../../../../components/ui';
import { useStoreFormBusinessTypes } from '../../../../hooks/useStoreFormBusinessTypes';
import { useOnlineActionGuard } from '../../../../hooks/useOnlineActionGuard';
import FormDraftNotice from '../../../../components/shared/FormDraftNotice';
import StoreFormModalFields from './StoreFormModalFields';
import {
  readStoredStoreDraft,
  saveStoredStoreDraft,
  removeStoredStoreDraft,
} from '../../utils/storeFormDraftUtils';
import {
  buildStoreFormSchema,
  buildStoreSubmitPayload,
  resolveBusinessTypeOptions,
  buildDefaultStoreValues,
  findDuplicateStoreName,
} from './storeFormSchema';

export default function StoreFormModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initial,
  companies = [],
  showCompanySelect = false,
  existingStores = [],
  title,
}) {
  const { t } = useTranslation();
  const { isActionBlocked, blockReason } = useOnlineActionGuard();
  const isCreate = !initial?.id;
  const initialDraft = useMemo(() => (open && isCreate ? readStoredStoreDraft() : null), [open, isCreate]);
  const [isDraftRestored, setIsDraftRestored] = useState(Boolean(initialDraft));

  const schema = useMemo(
    () => buildStoreFormSchema(t, { isCreate, showCompanySelect }),
    [t, isCreate, showCompanySelect]
  );

  const initialFormValues = useMemo(() => {
    const base = buildDefaultStoreValues(initial);
    return initialDraft ? { ...base, ...initialDraft } : base;
  }, [initial, initialDraft]);

  const { register, handleSubmit, reset, setValue, watch, clearErrors, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialFormValues,
  });

  const watchedValues = watch();
  const watchedCompanyId = watch('companyId');
  const watchedBusinessType = watch('businessType');
  const watchedRegionCode = watch('regionCode');
  const watchedDistrictCode = watch('districtCode');
  const watchedPhone = watch('phone');

  useEffect(() => {
    if (!open || !isCreate) return undefined;
    const timer = setTimeout(() => saveStoredStoreDraft(watchedValues), 400);
    return () => clearTimeout(timer);
  }, [open, isCreate, watchedValues]);

  const handleClearDraft = () => {
    removeStoredStoreDraft();
    setIsDraftRestored(false);
    reset(buildDefaultStoreValues(null));
  };

  const { types: companyTypes = [], defaultTypeCode, isLoading: typesLoading, needsCompany } = useStoreFormBusinessTypes(
    watchedCompanyId,
    { platformMode: showCompanySelect }
  );

  const prevCompanyRef = useRef('');

  const businessTypeOptions = useMemo(
    () => resolveBusinessTypeOptions({ needsCompany, companyTypes, defaultTypeCode, t }),
    [companyTypes, defaultTypeCode, needsCompany, t]
  );

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
    setValue('businessType', defaultType.code, { shouldValidate: true });
    setValue('businessTypeId', String(defaultType.id));
    clearErrors('businessType');
  }, [open, showCompanySelect, watchedCompanyId, watchedBusinessType, companyTypes, typesLoading, setValue, clearErrors]);

  useEffect(() => {
    if (!open) {
      prevCompanyRef.current = '';
      setIsDraftRestored(false);
      return;
    }
    const draft = isCreate ? readStoredStoreDraft() : null;
    reset(draft ? { ...buildDefaultStoreValues(initial), ...draft } : buildDefaultStoreValues(initial));
    setIsDraftRestored(Boolean(draft));
  }, [open, initial, isCreate, reset]);

  if (!open) return null;

  const handleFormSubmit = (data) => {
    const duplicate = findDuplicateStoreName(existingStores, {
      name: data.name,
      companyId: data.companyId || initial?.companyId,
      excludeId: initial?.id,
    });
    if (duplicate) {
      setError('name', {
        type: 'manual',
        message: t('platform.duplicateStoreName', {
          defaultValue: `Ushbu kompaniyada «${data.name.trim()}» nomli filial allaqachon mavjud`,
        }),
      });
      return;
    }
    onSubmit(buildStoreSubmitPayload(data, isCreate));
    removeStoredStoreDraft();
    setIsDraftRestored(false);
  };

  const modalTitle = title ?? (
    initial?.id
      ? (showCompanySelect ? t('platform.editBranch', { defaultValue: 'Filialni tahrirlash' }) : t('stores.editTitle'))
      : (showCompanySelect ? t('platform.addBranch', { defaultValue: 'Filial qo‘shish' }) : t('stores.addTitle'))
  );

  return (
    <BaseModal
      open={open}
      title={modalTitle}
      onClose={onClose}
      size="md"
      closeLabel={t('common.close', { defaultValue: 'Yopish' })}
      footer={(
        <div className="flex gap-2 justify-end w-full">
          <BaseButton variant="secondary" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleSubmit(handleFormSubmit)}
            loading={isPending}
            disabled={isPending || isActionBlocked}
            title={isActionBlocked ? blockReason : undefined}
          >
            {t('common.save')}
          </BaseButton>
        </div>
      )}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {isCreate && isDraftRestored ? (
          <FormDraftNotice onClear={handleClearDraft} />
        ) : null}
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
      </form>
    </BaseModal>
  );
}
