import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformEmailApi, userApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { AUDIENCE_MODES, ROLE_OPTIONS } from '../utils/emailConstants';
import { formatNumberWithSpaces } from '../utils/emailFormatUtils';
import { clearEmailDraft, loadEmailDraft, saveEmailDraft } from '../utils/emailDraftStorage';

export function useEmailSendFlow() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const savedDraft = loadEmailDraft();

  const [mode, setMode] = useState('role');
  const [roles, setRoles] = useState({ ADMIN: false, CASHIER: false, WAITER: false, MANAGER: false, COOK: false });
  const [subject, setSubjectState] = useState(() => savedDraft?.subject ?? '');
  const [message, setMessageState] = useState(() => savedDraft?.message ?? '');
  const [draftStatus, setDraftStatus] = useState('saved');
  const [errors, setErrors] = useState({});
  const [device, setDevice] = useState('desktop');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [debouncedPreview, setDebouncedPreview] = useState({ subject: '', message: '' });

  // Debounced auto-save draft to localStorage & debounced preview update
  useEffect(() => {
    setDraftStatus('saving');
    const timer = setTimeout(() => {
      const ok = saveEmailDraft({ subject, message });
      setDraftStatus(ok ? 'saved' : 'error');
      setDebouncedPreview({ subject, message });
    }, 350);
    return () => clearTimeout(timer);
  }, [subject, message]);

  // Real backend query for active users
  const { data: usersData } = useQuery({
    queryKey: ['platform-send-users'],
    queryFn: () => userApi.listManaged({ page: 0, size: 500, active: true }).then((r) => r.data).catch(() => null),
  });

  const activeUsers = useMemo(() => {
    return Array.isArray(usersData?.content) ? usersData.content : [];
  }, [usersData]);

  // Dynamic role counts calculated directly from active users
  const roleCounts = useMemo(() => {
    const counts = { ADMIN: 0, CASHIER: 0, WAITER: 0, MANAGER: 0, COOK: 0 };
    activeUsers.forEach((u) => {
      const r = u.role?.toUpperCase();
      if (counts[r] !== undefined) counts[r] += 1;
    });
    return counts;
  }, [activeUsers]);

  const roleOptions = useMemo(() => {
    return ROLE_OPTIONS.map((opt) => ({
      ...opt,
      count: roleCounts[opt.id] ?? 0,
    }));
  }, [roleCounts]);

  const toggleRole = (rId) => setRoles((p) => ({ ...p, [rId]: !p[rId] }));

  const recipientCount = useMemo(() => {
    if (mode === 'all') return usersData?.totalElements ?? activeUsers.length;
    return activeUsers.filter((u) => Boolean(roles[u.role?.toUpperCase()])).length;
  }, [mode, roles, activeUsers, usersData]);

  const setSubject = (val) => {
    setSubjectState(val.slice(0, 120));
    if (errors.subject) setErrors((p) => ({ ...p, subject: null }));
  };

  const setMessage = (val) => {
    setMessageState(val);
    if (errors.message) setErrors((p) => ({ ...p, message: null }));
  };

  const insertVariable = (varKey) => setMessage(message ? `${message} ${varKey}` : varKey);

  // Real preview query from backend
  const previewUser = activeUsers[0] || currentUser;
  const { data: previewData, isFetching: isPreviewLoading } = useQuery({
    queryKey: ['platform-email-preview', debouncedPreview.subject, debouncedPreview.message, previewUser?.id],
    queryFn: () =>
      platformEmailApi
        .preview({
          templateType: 'BROADCAST',
          subject: debouncedPreview.subject || t('platform.email.noSubject', 'Mavzu kiritilmagan'),
          message: debouncedPreview.message || t('platform.email.emptyMessagePreview', 'Xabar matni shu yerda ko‘rinadi.'),
          sampleUserId: previewUser?.id,
        })
        .then((r) => r.data)
        .catch(() => null),
    enabled: Boolean(debouncedPreview.subject.trim() || debouncedPreview.message.trim()),
    staleTime: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (body) => platformEmailApi.broadcast(body).then((r) => r.data),
    onSuccess: (data) => {
      clearEmailDraft();
      setSubjectState('');
      setMessageState('');
      setRoles({ ADMIN: false, CASHIER: false, WAITER: false, MANAGER: false, COOK: false });
      setIsConfirmOpen(false);
      toast.success(t('platform.email.sentSummary', { sent: data.sent ?? recipientCount, skipped: data.skipped ?? 0 }));
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Xat yuborishda xatolik yuz berdi'),
  });

  const handleSend = () => {
    const errs = {};
    if (!subject.trim()) errs.subject = 'Mavzuni kiriting';
    if (!message.trim()) errs.message = 'Xabar matnini kiriting';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Iltimos, maydonlarni to‘ldiring');
      return;
    }
    if (recipientCount === 0) {
      toast.error('Kamida bitta qabul qiluvchi tanlang');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    if (recipientCount === 0 || sendMutation.isPending) return;
    if (mode === 'all') {
      sendMutation.mutate({ subject: subject.trim(), message: message.trim(), selectAll: true });
    } else {
      const userIds = activeUsers.filter((u) => Boolean(roles[u.role?.toUpperCase()])).map((u) => u.id);
      sendMutation.mutate({ subject: subject.trim(), message: message.trim(), selectAll: false, userIds });
    }
  };

  const audienceLabel = useMemo(() => {
    if (mode === 'all') return t('platform.email.audienceAll', 'Barcha faol');
    const selected = ROLE_OPTIONS.filter((r) => roles[r.id]).map((r) => r.label);
    return selected.length > 0 ? selected.join(', ') : 'Rollar tanlanmagan';
  }, [mode, roles, t]);

  const currentSample = useMemo(() => {
    if (activeUsers.length > 0) {
      const u = activeUsers[0];
      return { name: u.fullName || u.username, email: u.email || 'user@aurent.uz', role: u.role, company: u.companyName || 'Aurent POS' };
    }
    if (currentUser) {
      return { name: currentUser.fullName || currentUser.username, email: currentUser.email || 'admin@aurent.uz', role: currentUser.role, company: 'Aurent POS' };
    }
    return { name: 'Xodim', email: 'user@aurent.uz', role: 'Foydalanuvchi', company: 'Aurent POS' };
  }, [activeUsers, currentUser]);

  return {
    mode, setMode, modes: AUDIENCE_MODES,
    roles, toggleRole, roleOptions,
    recipientCount,
    countLabel: `${formatNumberWithSpaces(recipientCount)} ta qabul qiluvchi`,
    sendLabel: recipientCount > 0 ? `Yuborish · ${formatNumberWithSpaces(recipientCount)} kishiga` : 'Qabul qiluvchi tanlang',
    subject, setSubject, subjectLength: subject.length,
    message, setMessage, insertVariable,
    draftStatus, errors,
    device, setDevice,
    currentSample, isDemoSample: activeUsers.length === 0,
    handleSend,
    isConfirmOpen,
    openConfirm: () => setIsConfirmOpen(true),
    closeConfirm: () => setIsConfirmOpen(false),
    handleConfirmSend,
    audienceLabel,
    previewHtml: previewData?.html || null,
    isPreviewLoading,
    isSending: sendMutation.isPending,
  };
}
