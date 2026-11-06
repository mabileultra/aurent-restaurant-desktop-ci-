import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { categoryApi } from '../../../../api/category.api';
import { BaseButton, BaseInput, BaseModal, BaseSelect } from '../../../../components/ui';

export default function CategoryModal({ category, businessTypes = [], onClose, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!category;

  const schema = z.object({
    name: z.string().min(1, t('validation.required')),
    description: z.string().optional(),
    businessTypeId: z.string().optional(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', businessTypeId: '' },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description ?? '',
        businessTypeId: category.businessTypeId ? String(category.businessTypeId) : '',
      });
    } else {
      reset({ name: '', description: '', businessTypeId: '' });
    }
  }, [category, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        businessTypeId: data.businessTypeId ? Number(data.businessTypeId) : null,
      };
      return isEdit ? categoryApi.update(category.id, payload) : categoryApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEdit ? t('categories.updated') : t('categories.created'));
      onSaved?.();
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message
          ?? (isEdit ? t('categories.updateFailed') : t('categories.createFailed'))
      ),
  });

  return (
    <BaseModal
      title={isEdit ? t('categories.modalTitleEdit') : t('categories.modalTitle')}
      onClose={onClose}
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            type="submit"
            form="category-form"
            disabled={isPending}
          >
            {isPending ? t('common.loading') : isEdit ? t('categories.save') : t('categories.create')}
          </BaseButton>
        </>
      )}
    >
      <form
        id="category-form"
        onSubmit={handleSubmit((d) => mutate(d))}
        className="space-y-4"
      >
        <BaseInput
          label={`${t('categories.name')} *`}
          placeholder={t('categories.namePh')}
          error={errors.name?.message}
          {...register('name')}
        />
        <BaseInput
          as="textarea"
          label={t('categories.description')}
          placeholder={t('categories.descPh')}
          rows={3}
          {...register('description')}
        />
        {businessTypes.length > 0 ? (
          <BaseSelect
            label={t('categories.businessType')}
            {...register('businessTypeId')}
            options={[
              { value: '', label: t('categories.businessTypeAll') },
              ...businessTypes.map((bt) => ({
                value: String(bt.id),
                label: bt.name,
              })),
            ]}
          />
        ) : null}
      </form>
    </BaseModal>
  );
}
