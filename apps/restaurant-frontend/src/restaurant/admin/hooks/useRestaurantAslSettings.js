import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { toastApiError } from '../../../utils/apiError';

const ASL_DEFAULT_BASE = 'https://xtrace.aslbelgisi.uz';

const EMPTY_FORM = {
  aslEnabled: false,
  aslApiBaseUrl: ASL_DEFAULT_BASE,
  aslApiKey: '',
};

export function useRestaurantAslSettings({ storeId, enabled = true }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rst-asl-integration', storeId],
    queryFn: () => pharmacyIntegrationApi.getAdminSettings(storeId).then((r) => r.data),
    enabled: enabled && storeId != null,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      aslEnabled: Boolean(data.aslEnabled),
      aslApiBaseUrl: data.aslApiBaseUrl || ASL_DEFAULT_BASE,
      aslApiKey: '',
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      pharmacyIntegrationApi.saveAdminSettings(storeId, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rst-asl-integration', storeId] });
      qc.invalidateQueries({ queryKey: ['pharmacy-integration', storeId] });
      toast.success(t('stores.pharmacyIntegration.saved'));
    },
    onError: (e) =>
      toastApiError(e, t('stores.pharmacyIntegration.saveFailed')),
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const payload = {
      aslEnabled: form.aslEnabled,
      aslApiBaseUrl: form.aslApiBaseUrl,
      dmedEnabled: false,
      dmedExternalId: null,
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
    isError,
    saving: saveMutation.isPending,
    maskedKey: data?.aslApiKeyMasked,
    hasAslApiKey: data?.hasAslApiKey,
  };
}
