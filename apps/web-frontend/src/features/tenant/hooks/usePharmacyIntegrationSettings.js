import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { PHARMACY_EXTERNAL_URLS } from '../../pharmacy-cashier/constants/pharmacyQuickLinks';

const EMPTY_FORM = {
  aslEnabled: false,
  aslApiBaseUrl: PHARMACY_EXTERNAL_URLS.aslPortal,
  aslApiKey: '',
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
      aslEnabled: data.aslEnabled,
      aslApiBaseUrl: data.aslApiBaseUrl || PHARMACY_EXTERNAL_URLS.aslPortal,
      aslApiKey: '',
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
    const payload = {
      aslEnabled: form.aslEnabled,
      aslApiBaseUrl: form.aslApiBaseUrl,
      dmedEnabled: form.dmedEnabled,
      dmedExternalId: form.dmedExternalId || null,
    };
    if (form.aslApiKey.trim()) {
      payload.aslApiKey = form.aslApiKey.trim();
    }
    saveMutation.mutate(payload);
  };

  return {
    t,
    form,
    updateField,
    submit,
    isLoading,
    saving: saveMutation.isPending,
    maskedKey: data?.aslApiKeyMasked,
    hasAslApiKey: data?.hasAslApiKey,
  };
}
