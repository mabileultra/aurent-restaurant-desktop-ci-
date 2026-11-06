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
  targeting,
  timing,
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
      targeting?.clearTargetSelection?.();
      queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
    },
    onError: () => {
      toast.error(
        t('platform.desktopNotifications.sendFailed', { defaultValue: 'Yuborib bo‘lmadi' })
      );
    },
  });

  const hasContent = Boolean(title.trim() && body.trim());
  const hasValidTarget = targeting ? targeting.hasValidTarget : true;
  const isScheduleValid = timing ? timing.isScheduleValid : true;
  const canSend = hasContent && isCustomHoursValid && hasValidTarget && isScheduleValid && !broadcastMutation.isPending;

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
    if (!hasValidTarget) {
      return t('platform.desktopNotifications.noTargetSelectedError', {
        defaultValue: 'Kamida bitta kompaniya yoki filialni tanlang',
      });
    }
    if (!isScheduleValid) {
      return t('platform.desktopNotifications.scheduleInvalidError', {
        defaultValue: "Rejalashtirilgan vaqtni to'g'ri (kelajakdagi vaqt) tanlang",
      });
    }
    return null;
  }, [hasContent, isCustomHoursValid, hasValidTarget, isScheduleValid, t]);

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
    if (!hasValidTarget) {
      toast.error(
        t('platform.desktopNotifications.noTargetSelectedError', {
          defaultValue: 'Kamida bitta kompaniya yoki filialni tanlang',
        })
      );
      return;
    }
    if (!isScheduleValid) {
      toast.error(
        t('platform.desktopNotifications.scheduleInvalidError', {
          defaultValue: "Rejalashtirilgan vaqtni to'g'ri (kelajakdagi vaqt) tanlang",
        })
      );
      return;
    }
    setConfirmModalOpen(true);
  }, [title, body, isCustomHoursValid, expiresInHours, hasValidTarget, isScheduleValid, t]);

  const executeBroadcast = useCallback(() => {
    if (!title.trim() || !body.trim() || !isCustomHoursValid || expiresInHours == null || !isScheduleValid) return;
    const isSelect = targeting?.targetScope === 'SELECT';
    broadcastMutation.mutate({
      title: title.trim().slice(0, 200),
      body: body.trim().slice(0, 4000),
      kind,
      expiresInHours,
      targetType: isSelect ? targeting.targetType : 'ALL',
      companyIds: isSelect && targeting.targetType === 'COMPANIES' ? targeting.selectedCompanyIds : undefined,
      storeIds: isSelect && targeting.targetType === 'STORES' ? targeting.selectedStoreIds : undefined,
      scheduleType: timing?.scheduleType || 'NOW',
      scheduledAt: timing?.scheduledAtIso || null,
    });
  }, [title, body, kind, expiresInHours, isCustomHoursValid, isScheduleValid, targeting, timing, broadcastMutation]);

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
