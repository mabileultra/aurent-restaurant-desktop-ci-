import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useDesktopNotificationDraft } from './useDesktopNotificationDraft';
import { useDesktopNotificationActions } from './useDesktopNotificationActions';
import { useDesktopNotificationTiming } from './useDesktopNotificationTiming';
import { useDesktopNotificationBroadcast } from './useDesktopNotificationBroadcast';
import { useDesktopNotificationTargeting } from './useDesktopNotificationTargeting';
import { useDesktopNotificationStats } from './useDesktopNotificationStats';
import { useDesktopNotificationHistoryList } from './useDesktopNotificationHistoryList';
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

  const targeting = useDesktopNotificationTargeting();
  const stats = useDesktopNotificationStats();
  const historyList = useDesktopNotificationHistoryList({ t });

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
    targetScope: targeting.targetScope,
    setTargetScope: targeting.setTargetScope,
    targetType: targeting.targetType,
    setTargetType: targeting.setTargetType,
    selectedCompanyIds: targeting.selectedCompanyIds,
    setSelectedCompanyIds: targeting.setSelectedCompanyIds,
    selectedStoreIds: targeting.selectedStoreIds,
    setSelectedStoreIds: targeting.setSelectedStoreIds,
    selectedCompanies: targeting.selectedCompanies,
    setSelectedCompanies: targeting.setSelectedCompanies,
    selectedStores: targeting.selectedStores,
    setSelectedStores: targeting.setSelectedStores,
    scheduleType,
    setScheduleType,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
  });

  const actions = useDesktopNotificationActions({
    queryClient,
    t,
    setTitle,
    setBody,
    setKind,
    draft,
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
    setKind('MESSAGE');
    setDuration('3d');
    setCustomHours('72');
    targeting.setTargetScope('ALL');
    targeting.setTargetType('COMPANIES');
    targeting.clearTargetSelection();
    setScheduleType('NOW');
    setScheduleDate('');
    setScheduleTime('09:00');
    draft.setIsDraftRestored(false);
    draft.setIsTargetingReset?.(false);
    draft.clearDraftStorage();
    toast.success(t('common.cleared', { defaultValue: 'Tozalandi' }));
  }, [t, draft, targeting]);

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
    activeTargetCount: stats.totalRegistersCount,
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
    isTargetingReset: draft.isTargetingReset,
    handleDismissDraftNotice: draft.handleDismissDraftNotice,
    activeRegistersCount: stats.activeRegistersCount,
    totalRegistersCount: stats.totalRegistersCount,
    allRegistersCount: stats.activeRegistersCount,
    onlineRegistersCount: stats.onlineRegistersCount,

    // Spread targeting
    ...targeting,

    // Confirm Modal
    confirmModalOpen: broadcast.confirmModalOpen,
    setConfirmModalOpen: broadcast.setConfirmModalOpen,
    executeBroadcast: broadcast.executeBroadcast,

    ...actions,
    ...historyList,

    handleSend: broadcast.handleInitiateSend,
    handleClear,
    sendPending: broadcast.sendPending,
    setExpiresInHours: (v) => setCustomHours(String(v)),
  };
}
