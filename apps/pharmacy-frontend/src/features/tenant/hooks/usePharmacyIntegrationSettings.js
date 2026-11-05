import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';

const EMPTY_FORM = {
  dmedEnabled: true,
  dmedExternalId: '',
};

export function usePharmacyIntegrationSettings({ store, open, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const storeId = store?.id;
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy-integration-admin', storeId],
    queryFn: () => pharmacyIntegrationApi.getAdminSettings(storeId).then((r) => r.data),
    enabled: open && Boolean(storeId),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      dmedEnabled: data.dmedEnabled,
      dmedExternalId: data.dmedExternalId || '',
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => pharmacyIntegrationApi.saveAdminSettings(storeId, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-integration-admin', storeId] });
      qc.invalidateQueries({ queryKey: ['pharmacy-integration', storeId] });
      toast.success(t('stores.pharmacyIntegration.saved'));
      onSaved?.();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.pharmacyIntegration.saveFailed')),
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    // ASL выключен продуктово — на бэк всегда false.
    saveMutation.mutate({
      aslEnabled: false,
      dmedEnabled: form.dmedEnabled,
      dmedExternalId: form.dmedExternalId || null,
    });
  };

  return {
    t,
    form,
    updateField,
    submit,
    isLoading,
    saving: saveMutation.isPending,
  };
}
