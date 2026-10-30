import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { addHours, format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { cashRegisterApi, platformDesktopNotificationsApi } from '../../../api';

const DRAFT_STORAGE_KEY = 'aurent_desktop_notification_draft_v1';

export function usePlatformDesktopNotificationsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // Language tab for composing message ('uz' | 'ru')
  const [langTab, setLangTab] = useState('uz');

  // Preview language for live cashier simulator ('uz' | 'ru')
  const [previewLang, setPreviewLang] = useState('uz');

  // Target audience ('ALL' | 'SELECT')
  const [targetScope, setTargetScope] = useState('ALL');
  const [targetGroup, setTargetGroup] = useState('OUTDATED'); // 'OUTDATED' | 'CUSTOM'

  // Message fields in Uzbek
  const [titleUz, setTitleUz] = useState('Ertaga 02:00–03:00 da texnik ishlar');
  const [bodyUz, setBodyUz] = useState('Bu vaqtda kassa oflayn rejimda ishlaydi. Cheklar internet qaytgach avtomatik yuboriladi.');

  // Message fields in Russian
  const [titleRu, setTitleRu] = useState('');
  const [bodyRu, setBodyRu] = useState('');

  // Kind of notification ('ALERT' = Muhim, 'UPDATE' = Yangilanish, 'MESSAGE' = Xabar)
  const [kind, setKind] = useState('ALERT');

  // Display duration on cashier ('1d', '3d', '1w', 'other')
  const [duration, setDuration] = useState('3d');
  const [customHours, setCustomHours] = useState('72');

  // Scheduling ('NOW' | 'SCHEDULE')
  const [scheduleType, setScheduleType] = useState('NOW');
  const [scheduleTime, setScheduleTime] = useState('');

  // Confirmation modal toggle & state
  const [needsConfirm, setNeedsConfirm] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Drawer for sent item details
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState(null);

  // Table filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Auto-saved draft indicator
  const [draftSaved, setDraftSaved] = useState(true);
  const draftTimerRef = useRef(null);

  // Restore draft on mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.titleUz !== undefined) setTitleUz(parsed.titleUz);
        if (parsed.bodyUz !== undefined) setBodyUz(parsed.bodyUz);
        if (parsed.titleRu !== undefined) setTitleRu(parsed.titleRu);
        if (parsed.bodyRu !== undefined) setBodyRu(parsed.bodyRu);
        if (parsed.kind) setKind(parsed.kind);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.customHours) setCustomHours(parsed.customHours);
        if (parsed.scheduleType) setScheduleType(parsed.scheduleType);
        if (parsed.scheduleTime) setScheduleTime(parsed.scheduleTime);
        if (parsed.targetScope) setTargetScope(parsed.targetScope);
        if (parsed.targetGroup) setTargetGroup(parsed.targetGroup);
        if (typeof parsed.needsConfirm === 'boolean') setNeedsConfirm(parsed.needsConfirm);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Save draft with debounce
  useEffect(() => {
    setDraftSaved(false);
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            titleUz,
            bodyUz,
            titleRu,
            bodyRu,
            kind,
            duration,
            customHours,
            scheduleType,
            scheduleTime,
            targetScope,
            targetGroup,
            needsConfirm,
          })
        );
        setDraftSaved(true);
      } catch {
        // ignore storage errors
      }
    }, 600);

    return () => clearTimeout(draftTimerRef.current);
  }, [
    titleUz,
    bodyUz,
    titleRu,
    bodyRu,
    kind,
    duration,
    customHours,
    scheduleType,
    scheduleTime,
    targetScope,
    targetGroup,
    needsConfirm,
  ]);

  // Total cash registers count query
  const cashRegistersQuery = useQuery({
    queryKey: ['cash-registers-count-for-broadcast'],
    queryFn: () => cashRegisterApi.getAll({ size: 1 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const totalRegistersCount = Number(cashRegistersQuery.data?.totalElements) || 0;

  // History query
  const historyQuery = useQuery({
    queryKey: ['platform-desktop-notifications'],
    queryFn: () => platformDesktopNotificationsApi.list().then((r) => r.data),
  });

  // Calculate duration in hours
  const expiresInHours = useMemo(() => {
    switch (duration) {
      case '1d':
        return 24;
      case '3d':
        return 72;
      case '1w':
        return 168;
      case 'other':
        return Number(customHours) || 72;
      default:
        return 72;
    }
  }, [duration, customHours]);

  // Formatted date when notification will expire
  const visibleUntilFormatted = useMemo(() => {
    const targetDate = addHours(new Date(), expiresInHours);
    try {
      return format(targetDate, 'd-MMMM, HH:mm', { locale: uz });
    } catch {
      return '';
    }
  }, [expiresInHours]);

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: (payload) => platformDesktopNotificationsApi.broadcast(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('platform.desktopNotifications.sent'));
      setTitleUz('');
      setBodyUz('');
      setTitleRu('');
      setBodyRu('');
      setConfirmModalOpen(false);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      queryClient.invalidateQueries({ queryKey: ['platform-desktop-notifications'] });
    },
    onError: () => {
      toast.error(t('platform.desktopNotifications.sendFailed'));
    },
  });

  // Сервер шлёт всем кассам. Числа 14 и 36 в макете не используем.
  const activeTargetCount = totalRegistersCount;

  // Handle send button click from form
  const handleInitiateSend = useCallback(() => {
    const activeTitle = titleUz.trim() || titleRu.trim();
    const activeBody = bodyUz.trim() || bodyRu.trim();
    if (!activeTitle || !activeBody) {
      toast.error(t('platform.desktopNotifications.validation'));
      return;
    }

    if (needsConfirm) {
      setConfirmModalOpen(true);
    } else {
      executeBroadcast();
    }
  }, [titleUz, titleRu, bodyUz, bodyRu, needsConfirm, t]);

  // Execute broadcast mutation
  const executeBroadcast = useCallback(() => {
    if (scheduleType !== 'NOW') {
      toast.error(t('platform.desktopNotifications.scheduleUnsupported', {
        defaultValue: 'Отложенная отправка пока не поддерживается. Отправьте сразу.',
      }));
      return;
    }
    if (targetScope !== 'ALL') {
      toast.error(t('platform.desktopNotifications.targetUnsupported', {
        defaultValue: 'Выбор отдельных касс пока не поддерживается. Можно отправить только всем.',
      }));
      return;
    }
    const pickedTitle = langTab === 'ru' ? titleRu.trim() || titleUz.trim() : titleUz.trim() || titleRu.trim();
    const pickedBody = langTab === 'ru' ? bodyRu.trim() || bodyUz.trim() : bodyUz.trim() || bodyRu.trim();
    const payload = {
      title: pickedTitle.slice(0, 200),
      body: pickedBody.slice(0, 4000),
      kind,
      expiresInHours,
    };
    broadcastMutation.mutate(payload);
  }, [
    scheduleType,
    targetScope,
    langTab,
    titleUz,
    titleRu,
    bodyUz,
    bodyRu,
    kind,
    expiresInHours,
    broadcastMutation,
    t,
  ]);

  // Clear form
  const handleClear = useCallback(() => {
    setTitleUz('');
    setBodyUz('');
    setTitleRu('');
    setBodyRu('');
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    toast.success(t('common.cleared', { defaultValue: 'Tozalandi' }));
  }, [t]);

  // Duplicate / copy sent item into form
  const handleDuplicate = useCallback(
    (item) => {
      if (!item) return;
      setTitleUz(item.title || '');
      setBodyUz(item.body || '');
      if (item.kind) setKind(item.kind);
      setSelectedItemForDrawer(null);
      toast.success(t('platform.desktopNotifications.actionDuplicate', { defaultValue: 'Nusxa olindi' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.getElementById('broadcast-title-input')?.focus();
      }, 150);
    },
    [t]
  );

  const handleRevoke = useCallback(async () => {
    if (!selectedItemForDrawer?.id) return;
    try {
      await platformDesktopNotificationsApi.revoke(selectedItemForDrawer.id);
      toast.success(t('platform.desktopNotifications.revoked', {
        defaultValue: 'Уведомление снято с касс',
      }));
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

  // Enriched history items with realistic status and delivery stats
  const enrichedHistory = useMemo(() => {
    const rawList = Array.isArray(historyQuery.data) ? historyQuery.data : [];
    const now = new Date();
    const allLabel = t('platform.desktopNotifications.targetAll', { defaultValue: 'Все кассы' });

    return rawList.map((item) => {
      const created = item.createdAt ? new Date(item.createdAt) : null;
      const expires = item.expiresAt ? new Date(item.expiresAt) : null;
      let status = 'ACTIVE';
      if (created && created > now) status = 'SCHEDULED';
      else if (expires && expires < now) status = 'EXPIRED';
      return {
        ...item,
        status,
        deliveredCount: null,
        totalCount: null,
        readCount: null,
        readPercent: null,
        targetLabel: allLabel,
      };
    });
  }, [historyQuery.data, t]);

  // Filtered history based on search query and status filter
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedHistory.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (q) {
        const tMatch = item.title?.toLowerCase().includes(q);
        const bMatch = item.body?.toLowerCase().includes(q);
        if (!tMatch && !bMatch) return false;
      }
      return true;
    });
  }, [enrichedHistory, searchQuery, statusFilter]);

  // Backward compatibility getters & setters for existing legacy components/tests
  const title = langTab === 'uz' ? titleUz : titleRu;
  const body = langTab === 'uz' ? bodyUz : bodyRu;
  const setTitle = (val) => (langTab === 'uz' ? setTitleUz(val) : setTitleRu(val));
  const setBody = (val) => (langTab === 'uz' ? setBodyUz(val) : setBodyRu(val));

  return {
    t,
    i18n,
    // Composing state
    langTab,
    setLangTab,
    previewLang,
    setPreviewLang,
    targetScope,
    setTargetScope,
    targetGroup,
    setTargetGroup,
    activeTargetCount,
    titleUz,
    setTitleUz,
    bodyUz,
    setBodyUz,
    titleRu,
    setTitleRu,
    bodyRu,
    setBodyRu,
    kind,
    setKind,
    duration,
    setDuration,
    customHours,
    setCustomHours,
    expiresInHours,
    visibleUntilFormatted,
    scheduleType,
    setScheduleType,
    scheduleTime,
    setScheduleTime,
    needsConfirm,
    setNeedsConfirm,
    draftSaved,
    totalRegistersCount: activeTargetCount,
    allRegistersCount: totalRegistersCount,

    // Confirm Modal
    confirmModalOpen,
    setConfirmModalOpen,
    executeBroadcast,

    // Detail Drawer
    selectedItemForDrawer,
    setSelectedItemForDrawer,

    // Table & Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    history: filteredHistory,
    totalHistoryCount: enrichedHistory.length,
    historyLoading: historyQuery.isLoading,

    // Actions
    handleSend: handleInitiateSend,
    handleClear,
    handleDuplicate,
    handleRevoke,
    handleExtend,
    sendPending: broadcastMutation.isPending,

    // Legacy compat
    title,
    setTitle,
    body,
    setBody,
    setExpiresInHours: (v) => setCustomHours(String(v)),
  };
}
