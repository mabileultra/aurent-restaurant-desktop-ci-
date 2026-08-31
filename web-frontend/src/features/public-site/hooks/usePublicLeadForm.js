import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { publicSiteApi } from '../../../api/publicSite.api';

const emptyForm = () => ({
  name: '',
  phone: '',
  email: '',
  preferredTime: '',
  message: '',
});

export function usePublicLeadForm({ leadType = 'QUESTION', source = 'contacts' } = {}) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  const mutation = useMutation({
    mutationFn: () => publicSiteApi.submitLead({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      leadType,
      source,
      preferredTime: form.preferredTime.trim() || undefined,
      message: form.message.trim() || undefined,
      locale: i18n.language?.slice(0, 2) || 'ru',
    }),
    onSuccess: () => {
      toast.success(t('publicSite.leadForm.success'));
      setForm(emptyForm());
    },
    onError: (e) => {
      toast.error(e.response?.data?.message ?? t('publicSite.leadForm.error'));
    },
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(t('publicSite.leadForm.required'));
      return;
    }
    mutation.mutate();
  };

  return {
    t,
    form,
    updateField,
    submit,
    isSubmitting: mutation.isPending,
  };
}
