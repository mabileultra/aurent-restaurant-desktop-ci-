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
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

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
      setPassword('');
      setPasswordConfirm('');
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
    if (password && password.length < 6) {
      toast.error(t('platform.account.passwordTooShort'));
      return;
    }
    if (password && password !== passwordConfirm) {
      toast.error(t('platform.account.passwordMismatch'));
      return;
    }
    saveMutation.mutate({
      username: nextUsername,
      password: password || undefined,
    });
  };

  return {
    t,
    username,
    setUsername,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    isLoading,
    handleSubmit,
    saving: saveMutation.isPending,
  };
}
