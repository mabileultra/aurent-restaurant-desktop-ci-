import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformDesktopNotificationsApi } from '../../../api/platform/desktopNotifications.api';

export function usePlatformDesktopNotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('MESSAGE');
  const [expiresInHours, setExpiresInHours] = useState('72');

  const historyQuery = useQuery({
    queryKey: ['platform-desktop-notifications'],
    queryFn: () => platformDesktopNotificationsApi.list().then((r) => r.data),
  });

  const broadcastMutation = useMutation({
    mutationFn: (payload) => platformDesktopNotificationsApi.broadcast(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('platform.desktopNotifications.sent'));
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
    },
    onError: () => {
      toast.error(t('platform.desktopNotifications.sendFailed'));
    },
  });

  const handleSend = () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      toast.error(t('platform.desktopNotifications.validation'));
      return;
    }
    broadcastMutation.mutate({
      title: trimmedTitle,
      body: trimmedBody,
      kind,
      expiresInHours: Number(expiresInHours) || null,
    });
  };

  return {
    t,
    title,
    setTitle,
    body,
    setBody,
    kind,
    setKind,
    expiresInHours,
    setExpiresInHours,
    history: historyQuery.data || [],
    historyLoading: historyQuery.isLoading,
    handleSend,
    sendPending: broadcastMutation.isPending,
  };
}
