import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformAccountApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';

export function usePlatformAccountPage() {
  const { t } = useTranslation();
  const patchUser = useAuthStore((s) => s.patchUser);
  const [username, setUsername] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['platform-operator-account'],
    queryFn: () => platformAccountApi.current().then((r) => r.data),
  });

  useEffect(() => {
    if (data?.username) setUsername(data.username);
  }, [data?.username]);

  const saveMutation = useMutation({
    mutationFn: (payload) => platformAccountApi.update(payload).then((r) => r.data),
    onSuccess: (result) => {
      patchUser({ username: result.username });
      toast.success(t('platform.account.saved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.account.saveFailed')),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextUsername = username.trim();
    if (!nextUsername) {
      toast.error(t('platform.account.loginRequired'));
      return;
    }
    saveMutation.mutate({ username: nextUsername });
  };

  return {
    t,
    username,
    setUsername,
    isLoading,
    handleSubmit,
    saving: saveMutation.isPending,
  };
}
