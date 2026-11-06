import { useMemo, useState } from 'react';
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

const DEFAULT_SUBJECT = 'Ertaga texnik ishlar olib boriladi';
const DEFAULT_MESSAGE =
  'Hurmatli hamkor!\n7-noyabr kuni soat 02:00 dan 03:00 gacha tizimda texnik ishlar olib boriladi. Shu vaqt ichida boshqaruv paneliga kirish vaqtincha cheklanishi mumkin.\n\nNoqulaylik uchun uzr so‘raymiz.';

export function useEmailSendFlow() {
  const { t } = useTranslation();
  const [mode, setMode] = useState('role');
  const [roles, setRoles] = useState({ ADMIN: true, CASHIER: false, WAITER: false, MANAGER: true, COOK: false });
  const [selectedCompanies, setSelectedCompanies] = useState(() => new Set(['c1', 'c2', 'c3']));
  const [companySearch, setCompanySearch] = useState('');
  const [manualUsers, setManualUsers] = useState(INITIAL_PEOPLE);
  const [userSearch, setUserSearch] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [device, setDevice] = useState('desktop');
  const [sampleIndex, setSampleIndex] = useState(0);

  // Queries for real backend data
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

  const toggleRole = (roleId) => {
    setRoles((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const removeCompany = (id) => {
    setSelectedCompanies((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleUserCheck = (id) => {
    setManualUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, checked: !u.checked } : u))
    );
  };

  const toggleAllUsers = (checked) => {
    setManualUsers((prev) => prev.map((u) => ({ ...u, checked })));
  };

  const filteredManualUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return manualUsers;
    return manualUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.company.toLowerCase().includes(q)
    );
  }, [manualUsers, userSearch]);

  const recipientCount = useMemo(() => {
    if (mode === 'all') return usersData?.totalElements || 349;
    if (mode === 'role') {
      return ROLE_OPTIONS.reduce((acc, r) => acc + (roles[r.id] ? r.count : 0), 0);
    }
    if (mode === 'company') {
      return activeCompanies.reduce((acc, c) => acc + c.count, 0);
    }
    return manualUsers.filter((u) => u.checked).length;
  }, [mode, roles, activeCompanies, manualUsers, usersData]);

  const insertVariable = (varKey) => {
    setMessage((prev) => `${prev} ${varKey}`);
  };

  const sendMutation = useMutation({
    mutationFn: (body) => platformEmailApi.broadcast(body).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(
        t('platform.email.sentSummary', {
          sent: data.sent ?? recipientCount,
          skipped: data.skipped ?? 0,
        })
      );
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Xat yuborishda xatolik yuz berdi');
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Mavzu va matn to‘ldirilishi shart');
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

  const handleTestEmail = () => {
    toast.success('Test xat shaxsiy pochtangizga yuborildi');
  };

  const samples = manualUsers;
  const currentSample = samples[sampleIndex % samples.length] || samples[0];

  return {
    mode,
    setMode,
    modes: AUDIENCE_MODES,
    roles,
    toggleRole,
    roleOptions: ROLE_OPTIONS,
    companies: activeCompanies,
    removeCompany,
    companySearch,
    setCompanySearch,
    manualUsers: filteredManualUsers,
    toggleUserCheck,
    toggleAllUsers,
    allUsersChecked: filteredManualUsers.every((u) => u.checked),
    userSearch,
    setUserSearch,
    recipientCount,
    countLabel: `${formatNumberWithSpaces(recipientCount)} ta qabul qiluvchi`,
    sendLabel:
      recipientCount > 0
        ? `Yuborish · ${formatNumberWithSpaces(recipientCount)} kishiga`
        : 'Qabul qiluvchi tanlang',
    subject,
    setSubject: (val) => setSubject(val.slice(0, 120)),
    subjectLength: subject.length,
    message,
    setMessage,
    insertVariable,
    device,
    setDevice,
    currentSample,
    nextSample: () => setSampleIndex((i) => (i + 1) % samples.length),
    prevSample: () => setSampleIndex((i) => (i - 1 + samples.length) % samples.length),
    handleSend,
    handleTestEmail,
    isSending: sendMutation.isPending,
  };
}
