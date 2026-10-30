import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformDesktopNotificationsApi } from '../../../api';

export function useDesktopNotificationBroadcast({
  t,
  title,
  setTitle,
  body,
  setBody,
  kind,
  expiresInHours,
  isCustomHoursValid,
  draft,
}) {
  const queryClient = useQueryClient();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const broadcastMutation = useMutation({
    mutationFn: (payload) =>
      platformDesktopNotificationsApi.broadcast(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(
        t('platform.desktopNotifications.sent', { defaultValue: 'Bildirishnoma yuborildi' })
      );
      setTitle('');
      setBody('');
      draft.setIsDraftRestored(false);
      setConfirmModalOpen(false);
      draft.clearDraftStorage();
      queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
    },
    onError: () => {
      toast.error(
        t('platform.desktopNotifications.sendFailed', { defaultValue: 'Yuborib bo‘lmadi' })
      );
    },
  });

  const hasContent = Boolean(title.trim() && body.trim());
  const canSend = hasContent && isCustomHoursValid && !broadcastMutation.isPending;

  const sendDisabledReason = useMemo(() => {
    if (!hasContent) {
      return t('platform.desktopNotifications.sendDisabledHint', {
        defaultValue: 'Yuborish uchun sarlavha va matnni kiriting',
      });
    }
    if (!isCustomHoursValid) {
      return t('platform.desktopNotifications.sendDisabledHoursHint', {
        defaultValue: "Muddatni to'g'ri kiriting (1 dan 720 soatgacha)",
      });
    }
    return null;
  }, [hasContent, isCustomHoursValid, t]);

  const handleInitiateSend = useCallback(() => {
    if (!title.trim() || !body.trim()) {
      toast.error(
        t('platform.desktopNotifications.validation', {
          defaultValue: 'Sarlavha va matnni to‘ldiring',
        })
      );
      return;
    }
    if (!isCustomHoursValid || expiresInHours == null) {
      toast.error(
        t('platform.desktopNotifications.customHoursError', {
          defaultValue: "Muddat 1 dan 720 soatgacha (30 kun) oralig'ida bo'lishi kerak",
        })
      );
      return;
    }
    setConfirmModalOpen(true);
  }, [title, body, isCustomHoursValid, expiresInHours, t]);

  const executeBroadcast = useCallback(() => {
    if (!title.trim() || !body.trim() || !isCustomHoursValid || expiresInHours == null) return;
    broadcastMutation.mutate({
      title: title.trim().slice(0, 200),
      body: body.trim().slice(0, 4000),
      kind,
      expiresInHours,
    });
  }, [title, body, kind, expiresInHours, isCustomHoursValid, broadcastMutation]);

  return {
    confirmModalOpen,
    setConfirmModalOpen,
    canSend,
    sendDisabledReason,
    handleInitiateSend,
    executeBroadcast,
    sendPending: broadcastMutation.isPending,
  };
}
