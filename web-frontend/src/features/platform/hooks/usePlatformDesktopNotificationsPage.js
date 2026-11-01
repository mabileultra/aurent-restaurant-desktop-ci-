import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { platformDesktopNotificationsApi, platformCashRegistersApi } from '../../../api';
import {
  enrichDesktopNotificationHistory,
  filterDesktopNotificationHistory,
} from './enrichDesktopNotificationHistory';
import { useDesktopNotificationDraft } from './useDesktopNotificationDraft';
import { useDesktopNotificationActions } from './useDesktopNotificationActions';
import { useDesktopNotificationTiming } from './useDesktopNotificationTiming';
import { useDesktopNotificationBroadcast } from './useDesktopNotificationBroadcast';
import { useDesktopNotificationTargeting } from './useDesktopNotificationTargeting';
import { formatUzbekMonthLower } from '../components/desktop-notifications/desktopNotificationFormatters';

export { formatUzbekMonthLower };

export function usePlatformDesktopNotificationsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [langTab, setLangTab] = useState('uz');
  const [previewLang, setPreviewLang] = useState('uz');
  const [targetGroup, setTargetGroup] = useState('OUTDATED');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('MESSAGE');
  const [duration, setDuration] = useState('3d');
  const [customHours, setCustomHours] = useState('72');
  const [scheduleType, setScheduleType] = useState('NOW');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const targeting = useDesktopNotificationTargeting();

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

  const actions = useDesktopNotificationActions({
    queryClient,
    t,
    setTitle,
    setBody,
    setKind,
    draft,
  });

  const registersStatsQuery = useQuery({
    queryKey: ['platform-cash-registers-stats'],
    queryFn: () => platformCashRegistersApi.getStats().then((r) => r.data).catch(() => null),
    staleTime: 60_000,
  });

  const totalRegistersCount = registersStatsQuery.data?.totalRegisters ?? null;
  const activeRegistersCount = registersStatsQuery.data?.activeRegisters ?? totalRegistersCount;
  const onlineRegistersCount = registersStatsQuery.data?.onlineRegisters ?? null;

  const historyQuery = useQuery({
    queryKey: ['platform-desktop-notifications'],
    queryFn: () => platformDesktopNotificationsApi.list().then((r) => r.data),
  });

  const timing = useDesktopNotificationTiming({
    duration,
    customHours,
    scheduleType,
    scheduleDate,
    scheduleTime,
  });

  const broadcast = useDesktopNotificationBroadcast({
    t,
    title,
    setTitle,
    body,
    setBody,
    kind,
    expiresInHours: timing.expiresInHours,
    isCustomHoursValid: timing.isCustomHoursValid,
    draft,
    targeting,
    timing: { ...timing, scheduleType },
  });

  const handleClear = useCallback(() => {
    setTitle('');
    setBody('');
    targeting.clearTargetSelection();
    setScheduleType('NOW');
    setScheduleDate('');
    setScheduleTime('09:00');
    draft.setIsDraftRestored(false);
    draft.clearDraftStorage();
    toast.success(t('common.cleared', { defaultValue: 'Tozalandi' }));
  }, [t, draft, targeting]);

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
    targetGroup,
    setTargetGroup,
    activeTargetCount: totalRegistersCount,
    kind,
    setKind,
    duration,
    setDuration,
    customHours,
    setCustomHours,
    isCustomHoursValid: timing.isCustomHoursValid,
    canSend: broadcast.canSend,
    sendDisabledReason: broadcast.sendDisabledReason,
    expiresInHours: timing.expiresInHours,
    visibleUntilFormatted: timing.visibleUntilFormatted,
    scheduleType,
    setScheduleType,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    isScheduleValid: timing.isScheduleValid,
    isScheduleInFuture: timing.isScheduleInFuture,
    scheduledAtIso: timing.scheduledAtIso,
    scheduledFormatted: timing.scheduledFormatted,
    needsConfirm: true,
    setNeedsConfirm: () => {},
    draftSaved: draft.draftSaved,
    isDraftRestored: draft.isDraftRestored,
    handleDismissDraftNotice: draft.handleDismissDraftNotice,
    activeRegistersCount,
    totalRegistersCount,
    allRegistersCount: activeRegistersCount,
    onlineRegistersCount,

    // Spread targeting
    ...targeting,

    // Confirm Modal
    confirmModalOpen: broadcast.confirmModalOpen,
    setConfirmModalOpen: broadcast.setConfirmModalOpen,
    executeBroadcast: broadcast.executeBroadcast,

    ...actions,

    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    history: filteredHistory,
    totalHistoryCount: enrichedHistory.length,
    historyLoading: historyQuery.isLoading,
    handleSend: broadcast.handleInitiateSend,
    handleClear,
    sendPending: broadcast.sendPending,
    setExpiresInHours: (v) => setCustomHours(String(v)),
  };
}
