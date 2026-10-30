import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { addHours, format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { platformDesktopNotificationsApi } from '../../../api';

const DRAFT_STORAGE_KEY = 'aurent_desktop_notification_draft_v1';

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

  // Language tab ('uz' as active standard single composition mode)
  const [langTab, setLangTab] = useState('uz');

  // Preview language for live cashier monitor simulator ('uz' | 'ru')
  const [previewLang, setPreviewLang] = useState('uz');

  // Target audience (Only 'ALL' is currently supported by backend)
  const [targetScope, setTargetScope] = useState('ALL');
  const [targetGroup, setTargetGroup] = useState('OUTDATED');

  // Message fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Kind of notification ('MESSAGE' = Xabar, 'UPDATE' = Yangilanish, 'ALERT' = Muhim)
  const [kind, setKind] = useState('MESSAGE');

  // Display duration on cashier ('1d', '3d', '1w', 'other')
  const [duration, setDuration] = useState('3d');
  const [customHours, setCustomHours] = useState('72');

  // Scheduling ('NOW' | 'SCHEDULE' - currently only NOW is supported)
  const [scheduleType, setScheduleType] = useState('NOW');
  const [scheduleTime, setScheduleTime] = useState('');

  // Confirmation modal: confirmation is strictly mandatory
  const needsConfirm = true;
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Drawer for sent item details
  const [selectedItemForDrawer, setSelectedItemForDrawer] = useState(null);

  // Table filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Auto-saved draft & restored state
  const [draftSaved, setDraftSaved] = useState(true);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const draftTimerRef = useRef(null);

  // Restore draft on mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restoredTitle = parsed.title || parsed.titleUz || '';
        const restoredBody = parsed.body || parsed.bodyUz || '';
        if (restoredTitle || restoredBody) {
          setTitle(restoredTitle);
          setBody(restoredBody);
          setIsDraftRestored(true);
        }
        if (parsed.kind) setKind(parsed.kind);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.customHours) setCustomHours(parsed.customHours);
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
        if (!title.trim() && !body.trim()) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } else {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              title,
              body,
              kind,
              duration,
              customHours,
            })
          );
        }
        setDraftSaved(true);
      } catch {
        // ignore storage errors
      }
    }, 600);

    return () => clearTimeout(draftTimerRef.current);
  }, [title, body, kind, duration, customHours]);

  // Super admin does not have permission to tenant /api/v1/cash-registers (avoiding 403).
  // Total registers count remains null until dedicated platform count endpoint is added on backend.
  const totalRegistersCount = null;

  // History query
  const historyQuery = useQuery({
    queryKey: ['platform-desktop-notifications'],
    queryFn: () => platformDesktopNotificationsApi.list().then((r) => r.data),
  });

  // Validate custom hours (strictly 1 to 720 hours)
  const isCustomHoursValid = useMemo(() => {
    if (duration !== 'other') return true;
    const trimmed = String(customHours ?? '').trim();
    if (!trimmed) return false;
    const num = Number(trimmed);
    return Number.isInteger(num) && num >= 1 && num <= 720;
  }, [duration, customHours]);

  // Calculate duration in hours
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

  // Formatted date when notification will expire (includes year if target year differs from current year)
  const visibleUntilFormatted = useMemo(() => {
    if (expiresInHours == null || !isCustomHoursValid) return '';
    try {
      const now = new Date();
      const targetDate = addHours(now, expiresInHours);
      const isDifferentYear = targetDate.getFullYear() !== now.getFullYear();
      const pattern = isDifferentYear ? 'd-MMMM yyyy, HH:mm' : 'd-MMMM, HH:mm';
      const raw = format(targetDate, pattern, { locale: uz });
      return formatUzbekMonthLower(raw);
    } catch {
      return '';
    }
  }, [expiresInHours, isCustomHoursValid]);

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: (payload) => platformDesktopNotificationsApi.broadcast(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(t('platform.desktopNotifications.sent', { defaultValue: 'Bildirishnoma yuborildi' }));
      setTitle('');
      setBody('');
      setIsDraftRestored(false);
      setConfirmModalOpen(false);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
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

  // Handle send button click from form
  const handleInitiateSend = useCallback(() => {
    const activeTitle = title.trim();
    const activeBody = body.trim();
    if (!activeTitle || !activeBody) {
      toast.error(t('platform.desktopNotifications.validation', { defaultValue: 'Sarlavha va matnni to‘ldiring' }));
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

  // Execute broadcast mutation
  const executeBroadcast = useCallback(() => {
    const activeTitle = title.trim();
    const activeBody = body.trim();
    if (!activeTitle || !activeBody) return;
    if (!isCustomHoursValid || expiresInHours == null) return;

    const payload = {
      title: activeTitle.slice(0, 200),
      body: activeBody.slice(0, 4000),
      kind,
      expiresInHours,
    };
    broadcastMutation.mutate(payload);
  }, [title, body, kind, expiresInHours, isCustomHoursValid, broadcastMutation]);

  // Clear form and stored draft
  const handleClear = useCallback(() => {
    setTitle('');
    setBody('');
    setIsDraftRestored(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    toast.success(t('common.cleared', { defaultValue: 'Tozalandi' }));
  }, [t]);

  // Dismiss restored draft notice without clearing
  const handleDismissDraftNotice = useCallback(() => {
    setIsDraftRestored(false);
  }, []);

  // Duplicate / copy sent item into form
  const handleDuplicate = useCallback(
    (item) => {
      if (!item) return;
      setTitle(item.title || '');
      setBody(item.body || '');
      if (item.kind) setKind(item.kind);
      setSelectedItemForDrawer(null);
      setIsDraftRestored(false);
      toast.success(t('platform.desktopNotifications.actionDuplicate', { defaultValue: 'Nusxa olindi' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.getElementById('broadcast-title-input')?.focus();
      }, 150);
    },
    [t]
  );

  // Revoke / dismiss item from active registers
  const handleRevoke = useCallback(() => {
    toast.error(t('platform.desktopNotifications.revokeUnsupported', {
      defaultValue: 'Xabarni kassalardan qaytarib olish serverda qo‘llab-quvvatlanmaydi.',
    }));
  }, [t]);

  const handleExtend = useCallback(() => {
    toast.error(t('platform.desktopNotifications.extendUnsupported', {
      defaultValue: 'Muddatni uzaytirish serverda qo‘llab-quvvatlanmaydi.',
    }));
  }, [t]);

  // Enriched history items with realistic status without fake counts
  const enrichedHistory = useMemo(() => {
    const rawList = Array.isArray(historyQuery.data) ? historyQuery.data : [];
    const now = new Date();
    const allLabel = t('platform.desktopNotifications.targetAll', { defaultValue: 'Barcha kassalar' });

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

  return {
    t,
    i18n,
    // Composing state
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
    draftSaved,
    isDraftRestored,
    handleDismissDraftNotice,
    totalRegistersCount,
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
    setExpiresInHours: (v) => setCustomHours(String(v)),
  };
}
