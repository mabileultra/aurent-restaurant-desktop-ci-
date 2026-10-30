import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { addHours } from 'date-fns';
import { platformDesktopNotificationsApi } from '../../../api';
import { formatUzbekDate } from '../components/desktop-notifications/desktopNotificationFormatters';
import {
  enrichDesktopNotificationHistory,
  filterDesktopNotificationHistory,
} from './enrichDesktopNotificationHistory';
import { useDesktopNotificationDraft } from './useDesktopNotificationDraft';

export function formatUzbekMonthLower(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(
    /-(Oktabr|Yanvar|Fevral|Mart|Aprel|May|Iyun|Iyul|Avgust|Sentabr|Noyabr|Dekabr)\b/gi,
    (m, month) => '-' + month.toLowerCase()
  );
}

export function usePlatformDesktopNotificationsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [langTab, setLangTab] = useState('uz');
  const [previewLang, setPreviewLang] = useState('uz');
  const [targetScope, setTargetScope] = useState('ALL');
  const [targetGroup, setTargetGroup] = useState('OUTDATED');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('MESSAGE');
  const [duration, setDuration] = useState('3d');
  const [customHours, setCustomHours] = useState('72');
  const [scheduleType, setScheduleType] = useState('NOW');
  const [scheduleTime, setScheduleTime] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const draft = useDesktopNotificationDraft({
    title,
    setTitle,
    body,
    setBody,
    kind,
    setKind,
    duration,
    setDuration,
    customHours,
    setCustomHours,
  });

  const totalRegistersCount = null;

  const historyQuery = useQuery({
    queryKey: ['platform-desktop-notifications'],
    queryFn: () => platformDesktopNotificationsApi.list().then((r) => r.data),
  });

  const isCustomHoursValid = useMemo(() => {
    if (duration !== 'other') return true;
    const trimmed = String(customHours ?? '').trim();
    if (!trimmed) return false;
    const num = Number(trimmed);
    return Number.isInteger(num) && num >= 1 && num <= 720;
  }, [duration, customHours]);

  const expiresInHours = useMemo(() => {
    switch (duration) {
      case '1d':
        return 24;
      case '3d':
        return 72;
      case '1w':
        return 168;
      case 'other': {
        const trimmed = String(customHours ?? '').trim();
        if (!trimmed) return null;
        const num = Number(trimmed);
        return Number.isInteger(num) && num >= 1 && num <= 720 ? num : null;
      }
      default:
        return 72;
    }
  }, [duration, customHours]);

  const visibleUntilFormatted = useMemo(() => {
    if (expiresInHours == null || !isCustomHoursValid) return '';
    try {
      const now = new Date();
      const targetDate = addHours(now, expiresInHours);
      const isDifferentYear = targetDate.getFullYear() !== now.getFullYear();
      return formatUzbekDate(targetDate, isDifferentYear ? 'd-MMMM yyyy, HH:mm' : 'd-MMMM, HH:mm', 'uz');
    } catch {
      return '';
    }
  }, [expiresInHours, isCustomHoursValid]);

  const broadcastMutation = useMutation({
    mutationFn: (payload) => platformDesktopNotificationsApi.broadcast(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('platform.desktopNotifications.sent', { defaultValue: 'Bildirishnoma yuborildi' }));
      setTitle('');
      setBody('');
      draft.setIsDraftRestored(false);
      setConfirmModalOpen(false);
      draft.clearDraftStorage();
      queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
    },
    onError: () => {
      toast.error(t('platform.desktopNotifications.sendFailed', { defaultValue: 'Yuborib bo‘lmadi' }));
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
      toast.error(t('platform.desktopNotifications.validation', { defaultValue: 'Sarlavha va matnni to‘ldiring' }));
      return;
    }
    if (!isCustomHoursValid || expiresInHours == null) {
      toast.error(t('platform.desktopNotifications.customHoursError', {
        defaultValue: "Muddat 1 dan 720 soatgacha (30 kun) oralig'ida bo'lishi kerak",
      }));
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

  const handleClear = useCallback(() => {
    setTitle('');
    setBody('');
    draft.setIsDraftRestored(false);
    draft.clearDraftStorage();
    toast.success(t('common.cleared', { defaultValue: 'Tozalandi' }));
  }, [t, draft]);

  const handleDuplicate = useCallback((item) => {
    if (!item) return;
    setTitle(item.title || '');
    setBody(item.body || '');
    if (item.kind) setKind(item.kind);
    setSelectedItemForDrawer(null);
    draft.setIsDraftRestored(false);
    toast.success(t('platform.desktopNotifications.actionDuplicate', { defaultValue: 'Nusxa olindi' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.getElementById('broadcast-title-input')?.focus(), 150);
  }, [t, draft]);

  const handleRevoke = useCallback(async () => {
    if (!selectedItemForDrawer?.id) return;
    try {
      await platformDesktopNotificationsApi.revoke(selectedItemForDrawer.id);
      toast.success(t('platform.desktopNotifications.revoked', { defaultValue: 'Уведомление снято с касс' }));
      queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
      setSelectedItemForDrawer(null);
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('platform.desktopNotifications.revokeFailed', {
        defaultValue: 'Не удалось снять уведомление',
      }));
    }
  }, [selectedItemForDrawer, t, queryClient]);

  const handleExtend = useCallback(async () => {
    if (!selectedItemForDrawer?.id) return;
    try {
      await platformDesktopNotificationsApi.extend(selectedItemForDrawer.id, { expiresInHours: 24 });
      toast.success(t('platform.desktopNotifications.extended', {
        defaultValue: 'Срок уведомления продлён на 24 часа',
      }));
      queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
    } catch (e) {
      toast.error(e.response?.data?.message ?? t('platform.desktopNotifications.extendFailed', {
        defaultValue: 'Не удалось продлить срок',
      }));
    }
  }, [selectedItemForDrawer, t, queryClient]);

  const enrichedHistory = useMemo(
    () => enrichDesktopNotificationHistory(
      historyQuery.data,
      t('platform.desktopNotifications.targetAll', { defaultValue: 'Barcha kassalar' })
    ),
    [historyQuery.data, t]
  );
  const filteredHistory = useMemo(
    () => filterDesktopNotificationHistory(enrichedHistory, searchQuery, statusFilter),
    [enrichedHistory, searchQuery, statusFilter]
  );

  return {
    t,
    i18n,
    title,
    setTitle,
    body,
    setBody,
    titleUz: title,
    setTitleUz: setTitle,
    bodyUz: body,
    setBodyUz: setBody,
    titleRu: title,
    setTitleRu: setTitle,
    bodyRu: body,
    setBodyRu: setBody,
    langTab,
    setLangTab,
    previewLang,
    setPreviewLang,
    targetScope,
    setTargetScope,
    targetGroup,
    setTargetGroup,
    activeTargetCount: totalRegistersCount,
    kind,
    setKind,
    duration,
    setDuration,
    customHours,
    setCustomHours,
    isCustomHoursValid,
    canSend,
    sendDisabledReason,
    expiresInHours,
    visibleUntilFormatted,
    scheduleType,
    setScheduleType,
    scheduleTime,
    setScheduleTime,
    needsConfirm: true,
    setNeedsConfirm: () => {},
    draftSaved: draft.draftSaved,
    isDraftRestored: draft.isDraftRestored,
    handleDismissDraftNotice: draft.handleDismissDraftNotice,
    totalRegistersCount,
    allRegistersCount: totalRegistersCount,
    confirmModalOpen,
    setConfirmModalOpen,
    executeBroadcast,
    selectedItemForDrawer,
    setSelectedItemForDrawer,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    history: filteredHistory,
    totalHistoryCount: enrichedHistory.length,
    historyLoading: historyQuery.isLoading,
    handleSend: handleInitiateSend,
    handleClear,
    handleDuplicate,
    handleRevoke,
    handleExtend,
    sendPending: broadcastMutation.isPending,
    setExpiresInHours: (v) => setCustomHours(String(v)),
  };
}
