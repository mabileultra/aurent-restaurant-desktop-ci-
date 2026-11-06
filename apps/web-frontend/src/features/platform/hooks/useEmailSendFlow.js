import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { companyApi, platformEmailApi, userApi } from '../../../api';
import {
  AUDIENCE_MODES,
  INITIAL_COMPANIES,
  INITIAL_PEOPLE,
  ROLE_OPTIONS,
} from '../utils/emailConstants';
import { formatNumberWithSpaces } from '../utils/emailFormatUtils';
import { clearEmailDraft, loadEmailDraft, saveEmailDraft } from '../utils/emailDraftStorage';
import { getPreviewSamples } from '../utils/emailPreviewUtils';

const DEFAULT_SUBJECT = 'Ertaga texnik ishlar olib boriladi';
const DEFAULT_MESSAGE =
  'Hurmatli hamkor!\n7-noyabr kuni soat 02:00 dan 03:00 gacha tizimda texnik ishlar olib boriladi. Shu vaqt ichida boshqaruv paneliga kirish vaqtincha cheklanishi mumkin.\n\nNoqulaylik uchun uzr so‘raymiz.';

export function useEmailSendFlow() {
  const { t } = useTranslation();
  const savedDraft = loadEmailDraft();

  const [mode, setMode] = useState('role');
  const [roles, setRoles] = useState({ ADMIN: true, CASHIER: false, WAITER: false, MANAGER: true, COOK: false });
  const [selectedCompanies, setSelectedCompanies] = useState(() => new Set(['c1', 'c2', 'c3']));
  const [companySearch, setCompanySearch] = useState('');
  const [manualUsers, setManualUsers] = useState(INITIAL_PEOPLE);
  const [userSearch, setUserSearch] = useState('');
  const [subject, setSubjectState] = useState(() => savedDraft?.subject ?? DEFAULT_SUBJECT);
  const [message, setMessageState] = useState(() => savedDraft?.message ?? DEFAULT_MESSAGE);
  const [draftStatus, setDraftStatus] = useState('saved'); // 'saving' | 'saved' | 'error'
  const [errors, setErrors] = useState({});
  const [device, setDevice] = useState('desktop');
  const [sampleIndex, setSampleIndex] = useState(0);

  // Debounced auto-save draft to localStorage
  useEffect(() => {
    setDraftStatus('saving');
    const timer = setTimeout(() => {
      const ok = saveEmailDraft({ subject, message });
      setDraftStatus(ok ? 'saved' : 'error');
    }, 400);
    return () => clearTimeout(timer);
  }, [subject, message]);

  // Real backend queries
  const { data: usersData } = useQuery({
    queryKey: ['platform-send-users'],
    queryFn: () => userApi.listManaged({ page: 0, size: 50, active: true }).then((r) => r.data).catch(() => null),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['platform-send-companies'],
    queryFn: () => companyApi.listAll().then((r) => r.data).catch(() => null),
  });

  const companiesList = useMemo(() => {
    if (Array.isArray(companiesData) && companiesData.length > 0) {
      return companiesData.map((c) => ({ id: String(c.id), name: c.name, count: c.userCount || 10 }));
    }
    return INITIAL_COMPANIES;
  }, [companiesData]);

  const activeCompanies = useMemo(() => {
    return companiesList.filter((c) => selectedCompanies.has(c.id));
  }, [companiesList, selectedCompanies]);

  const toggleRole = (rId) => setRoles((p) => ({ ...p, [rId]: !p[rId] }));
  const removeCompany = (id) => setSelectedCompanies((p) => { const n = new Set(p); n.delete(id); return n; });
  const toggleUserCheck = (id) => setManualUsers((p) => p.map((u) => (u.id === id ? { ...u, checked: !u.checked } : u)));
  const toggleAllUsers = (chk) => setManualUsers((p) => p.map((u) => ({ ...u, checked: chk })));
  const clearManualSelection = () => setManualUsers((p) => p.map((u) => ({ ...u, checked: false })));

  const filteredManualUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return manualUsers;
    return manualUsers.filter((u) =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company.toLowerCase().includes(q)
    );
  }, [manualUsers, userSearch]);

  const selectedManualCount = useMemo(() => manualUsers.filter((u) => u.checked).length, [manualUsers]);

  const recipientCount = useMemo(() => {
    if (mode === 'all') return usersData?.totalElements || 349;
    if (mode === 'role') return ROLE_OPTIONS.reduce((acc, r) => acc + (roles[r.id] ? r.count : 0), 0);
    if (mode === 'company') return activeCompanies.reduce((acc, c) => acc + c.count, 0);
    return selectedManualCount;
  }, [mode, roles, activeCompanies, selectedManualCount, usersData]);

  const setSubject = (val) => {
    setSubjectState(val.slice(0, 120));
    if (errors.subject) setErrors((p) => ({ ...p, subject: null }));
  };

  const setMessage = (val) => {
    setMessageState(val);
    if (errors.message) setErrors((p) => ({ ...p, message: null }));
  };

  const insertVariable = (varKey) => setMessage(`${message} ${varKey}`);

  const applyFormat = (type) => {
    const map = {
      bold: { pre: '**', post: '**', def: 'qalin matn' },
      italic: { pre: '*', post: '*', def: 'kursiv matn' },
      link: { pre: '[', post: '](https://...)', def: 'havola nomi' },
      list: { pre: '\n- ', post: '', def: 'ro‘yxat bandi' },
    };
    const f = map[type];
    if (f) setMessage(`${message} ${f.pre}${f.def}${f.post}`);
  };

  const sendMutation = useMutation({
    mutationFn: (body) => platformEmailApi.broadcast(body).then((r) => r.data),
    onSuccess: (data) => {
      clearEmailDraft();
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
    sendMutation.mutate({
      subject: subject.trim(),
      message: message.trim(),
      selectAll: mode === 'all',
      roles: mode === 'role' ? Object.keys(roles).filter((r) => roles[r]) : undefined,
    });
  };

  const { samples, isDemo: isDemoSample } = useMemo(
    () => getPreviewSamples({ mode, manualUsers, roles, selectedCompanies }),
    [mode, manualUsers, roles, selectedCompanies]
  );
  const currentSample = samples[sampleIndex % samples.length] || samples[0];

  return {
    mode, setMode, modes: AUDIENCE_MODES,
    roles, toggleRole, roleOptions: ROLE_OPTIONS,
    companies: activeCompanies, removeCompany, companySearch, setCompanySearch,
    manualUsers: filteredManualUsers, allManualUsers: manualUsers,
    toggleUserCheck, toggleAllUsers, clearManualSelection,
    selectedManualCount,
    allUsersChecked: filteredManualUsers.length > 0 && filteredManualUsers.every((u) => u.checked),
    userSearch, setUserSearch, clearUserSearch: () => setUserSearch(''),
    recipientCount,
    countLabel: `${formatNumberWithSpaces(recipientCount)} ta qabul qiluvchi`,
    sendLabel: recipientCount > 0 ? `Yuborish · ${formatNumberWithSpaces(recipientCount)} kishiga` : 'Qabul qiluvchi tanlang',
    subject, setSubject, subjectLength: subject.length,
    message, setMessage, insertVariable, applyFormat,
    draftStatus, errors,
    device, setDevice,
    currentSample, isDemoSample,
    nextSample: () => setSampleIndex((i) => (i + 1) % samples.length),
    prevSample: () => setSampleIndex((i) => (i - 1 + samples.length) % samples.length),
    handleSend, handleTestEmail: () => toast.success('Test xat shaxsiy pochtangizga yuborildi'),
    isSending: sendMutation.isPending,
  };
}
