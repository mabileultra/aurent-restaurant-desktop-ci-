import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { categoryApi } from '../../../../api/category.api';
import RstModal from '../../../../restaurant/shared/components/RstModal';
import { BaseInput } from '../../../../components/ui';
import { toastApiError } from '../../../../utils/apiError';

function emptyForm() {
  return { name: '', description: '', businessTypeId: '' };
}

export default function CategoryModal({
  open,
  category,
  businessTypes = [],
  onClose,
  onSaved,
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = Boolean(category);
  const [form, setForm] = useState(emptyForm);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (category) {
      setForm({
        name: category.name ?? '',
        description: category.description ?? '',
        businessTypeId: category.businessTypeId != null ? String(category.businessTypeId) : '',
      });
    } else {
      setForm(emptyForm());
    }
    setNameError('');
  }, [open, category]);

  const saveMutation = useMutation({
    mutationFn: (payload) => (
      isEdit ? categoryApi.update(category.id, payload) : categoryApi.create(payload)
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('categories') });
      toast.success(isEdit ? t('categories.updated') : t('categories.created'));
      onSaved?.();
    },
    onError: (err) => toastApiError(
      err,
      isEdit ? t('categories.updateFailed') : t('categories.createFailed'),
    ),
  });

  const submit = () => {
    const name = form.name.trim();
    if (!name) {
      setNameError(t('validation.required'));
      return;
    }
    setNameError('');
    saveMutation.mutate({
      name,
      description: form.description.trim() || null,
      businessTypeId: form.businessTypeId ? Number(form.businessTypeId) : null,
    });
  };

  return (
    <RstModal
      open={open}
      title={isEdit ? t('categories.modalTitleEdit') : t('categories.modalTitle')}
      onClose={onClose}
      onSubmit={submit}
      isPending={saveMutation.isPending}
      submitLabel={isEdit ? t('categories.save') : t('categories.create')}
      cancelLabel={t('common.cancel')}
      asForm
    >
      <BaseInput
        label={t('categories.name')}
        required
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder={t('categories.namePh')}
        error={nameError}
      />
      <BaseInput
        as="textarea"
        label={t('categories.description')}
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        placeholder={t('categories.descPh')}
        rows={3}
      />
      {businessTypes.length > 0 ? (
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{t('categories.businessType')}</span>
          <select
            className="form-select"
            value={form.businessTypeId}
            onChange={(e) => setForm((prev) => ({ ...prev, businessTypeId: e.target.value }))}
          >
            <option value="">{t('categories.businessTypeAll')}</option>
            {businessTypes.map((bt) => (
              <option key={bt.id} value={bt.id}>{bt.name}</option>
            ))}
          </select>
        </label>
      ) : null}
    </RstModal>
  );
}
