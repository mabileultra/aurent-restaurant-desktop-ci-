import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';

export function useDrugRegistryPage(t) {
  const qc = useQueryClient();

  const latestQuery = useQuery({
    queryKey: ['pharmacy-drug-registry-latest'],
    queryFn: () => pharmacyWarehouseApi.drugRegistryLatest().then((r) => r.data),
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => pharmacyWarehouseApi.drugRegistryUpload(file).then((r) => r.data),
    onSuccess: (data) => {
      if (data?.skipped) {
        toast.success(t('drugRegistry.alreadyLoaded'));
      } else {
        toast.success(t('drugRegistry.uploadDone', {
          rows: data?.rowCount ?? 0,
          filled: data?.filledProducts ?? 0,
        }));
      }
      qc.invalidateQueries({ queryKey: ['pharmacy-drug-registry-latest'] });
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  return {
    latest: latestQuery.data,
    uploading: uploadMutation.isPending,
    upload: (file) => {
      if (file) uploadMutation.mutate(file);
    },
  };
}
