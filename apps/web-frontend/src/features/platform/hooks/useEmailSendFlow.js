import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformEmailApi, userApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { AUDIENCE_MODES, ROLE_OPTIONS } from '../utils/emailConstants';
import { formatNumberWithSpaces } from '../utils/emailFormatUtils';
import { clearEmailDraft, loadEmailDraft, saveEmailDraft } from '../utils/emailDraftStorage';
import {
  createIdempotencyKey,
  computeRoleCounts,
  buildRoleOptionsWithCounts,
  computeRecipientCount,
  resolveEmailSampleUser,
  validateEmailSendPayload,
} from '../utils/emailSendHelpers';

export function useEmailSendFlow() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const idempotencyKeyRef = useRef(null);
  const locale = i18n.language?.startsWith('ru') ? 'ru' : 'uz';
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

  const roleCounts = useMemo(() => computeRoleCounts(activeUsers), [activeUsers]);
  const roleOptions = useMemo(() => buildRoleOptionsWithCounts(roleCounts), [roleCounts]);

  const toggleRole = (rId) => setRoles((p) => ({ ...p, [rId]: !p[rId] }));

  const recipientCount = useMemo(() => {
    return computeRecipientCount(mode, roles, activeUsers, usersData?.totalElements);
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
      idempotencyKeyRef.current = null;
      toast.success(
        t('platform.email.sentSummary', {
          sent: data.sent ?? recipientCount,
          skipped: data.skipped ?? 0,
          failed: data.failed ?? 0,
        })
      );
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Xat yuborishda xatolik yuz berdi'),
  });

  const testMutation = useMutation({
    mutationFn: (body) => platformEmailApi.test(body).then((r) => r.data),
    onSuccess: () => toast.success(t('platform.email.testSent', 'Test xat yuborildi')),
    onError: (err) => toast.error(err?.response?.data?.message || 'Test xat yuborilmadi'),
  });

  const handleSend = () => {
    const check = validateEmailSendPayload({ subject, message, recipientCount });
    if (!check.valid) {
      if (Object.keys(check.errors).length > 0) setErrors(check.errors);
      toast.error(check.toastMessage);
      return;
    }
    idempotencyKeyRef.current = createIdempotencyKey();
    setIsConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    if (recipientCount === 0 || sendMutation.isPending) return;
    const key = idempotencyKeyRef.current || createIdempotencyKey();
    idempotencyKeyRef.current = key;
    const base = {
      subject: subject.trim(),
      message: message.trim(),
      locale,
      idempotencyKey: key,
    };
    if (mode === 'all') {
      sendMutation.mutate({ ...base, selectAll: true });
      return;
    }
    const selectedRoles = ROLE_OPTIONS.filter((r) => roles[r.id]).map((r) => r.id);
    if (selectedRoles.length === 0) {
      toast.error('Kamida bitta rol tanlang');
      return;
    }
    sendMutation.mutate({ ...base, selectAll: false, roles: selectedRoles });
  };

  const handleTestEmail = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Iltimos, maydonlarni to‘ldiring');
      return;
    }
    testMutation.mutate({
      subject: subject.trim(),
      message: message.trim(),
      locale,
    });
  };

  const audienceLabel = useMemo(() => {
    if (mode === 'all') return t('platform.email.audienceAll', 'Barcha faol');
    const selected = ROLE_OPTIONS.filter((r) => roles[r.id]).map((r) => r.label);
    return selected.length > 0 ? selected.join(', ') : 'Rollar tanlanmagan';
  }, [mode, roles, t]);

  const currentSample = useMemo(() => {
    return resolveEmailSampleUser(activeUsers, currentUser);
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
    handleTestEmail,
    isConfirmOpen,
    openConfirm: () => setIsConfirmOpen(true),
    closeConfirm: () => setIsConfirmOpen(false),
    handleConfirmSend,
    audienceLabel,
    previewHtml: previewData?.html || null,
    isPreviewLoading,
    isSending: sendMutation.isPending,
    isTesting: testMutation.isPending,
  };
}
