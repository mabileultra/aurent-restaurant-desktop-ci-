import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rstMenuPhotoApi } from '../../api/menuPhoto.api';

export function menuPhotosQueryKey(storeId) {
  return ['rst-menu-photos', storeId];
}

export function useMenuPhotos(storeId, t) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: menuPhotosQueryKey(storeId),
    queryFn: () => rstMenuPhotoApi.get(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 15_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
  const mutation = useMutation({
    mutationFn: (enabled) => rstMenuPhotoApi.setEnabled(storeId, enabled).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(menuPhotosQueryKey(storeId), data);
      if (t) toast.success(t('rst.admin.menuPhotosSaved'));
    },
    onError: () => {
      if (t) toast.error(t('rst.admin.saveFailed'));
    },
  });

  return {
    enabled: query.isError || query.data?.enabled !== false,
    saving: mutation.isPending,
    toggle: () => mutation.mutate(!(query.data?.enabled !== false)),
  };
}
