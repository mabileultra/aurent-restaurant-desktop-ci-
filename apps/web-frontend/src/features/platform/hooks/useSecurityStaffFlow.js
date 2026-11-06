import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformSecurityApi } from '../../../api';
import { resolveUserInitials } from '../utils/securityFormatUtils';
import { PERMISSIONS_MATRIX_ROWS } from '../utils/securityConstants';

const INITIAL_STAFF = [
  {
    id: 'sa',
    firstName: 'Administrator',
    lastName: 'Super',
    fullName: 'Administrator Super',
    username: 'superadmin',
    email: 'superadmin@platform.local',
    role: 'SUPER_ADMIN',
    twoFactor: true,
    lastSeen: 'Bugun 12:31 · Samarqand',
    status: 'active',
  },
  {
    id: 'op',
    firstName: 'Operator',
    lastName: 'Platform',
    fullName: 'Operator Platform',
    username: 'platformadmin',
    email: 'platformadmin@platform.local',
    role: 'PLATFORM_ADMIN',
    twoFactor: false,
    lastSeen: 'Bugun 09:02 · Toshkent',
    status: 'locked',
  },
  {
    id: 'an',
    firstName: 'Analitika',
    lastName: 'Analitika',
    fullName: 'Analitika Analitika',
    username: 'analitik',
    email: 'analitik@gmail.com',
    role: 'PLATFORM_ANALYTICS',
    twoFactor: false,
    lastSeen: 'Bugun 10:40 · Samarqand',
    status: 'active',
  },
];

const TEMP_PASSWORDS = ['Kz7#pR2m-Vq', 'tU4!hN9w-Lx', 'Bq8$eY3s-Jd', 'Wp5#mF2x-Qr'];

const emptyStaffForm = () => ({
  mode: 'create',
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'PLATFORM_ADMIN',
  twoFactor: true,
  mustChangePassword: true,
  isActive: true,
});

/**
 * Xavfsizlik "Xodimlar" tabi mantiq hooki.
 */
export function useSecurityStaffFlow() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [tempPwIndex, setTempPwIndex] = useState(0);

  const { data: remoteAdmins = [], isLoading } = useQuery({
    queryKey: ['platform-security-super-admins'],
    queryFn: () => platformSecurityApi.listSuperAdmins().then((r) => r.data),
  });

  const staffList = useMemo(() => {
    if (Array.isArray(remoteAdmins) && remoteAdmins.length > 0) {
      return remoteAdmins.map((item) => ({
        id: item.id,
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        fullName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username,
        username: item.username,
        email: item.email || `${item.username}@platform.local`,
        role: item.role || 'PLATFORM_ADMIN',
        twoFactor: item.role === 'SUPER_ADMIN',
        lastSeen: 'Faol hozir',
        status: 'active',
        initials: resolveUserInitials(item.firstName, item.lastName),
      }));
    }
    return INITIAL_STAFF.map((item) => ({
      ...item,
      initials: resolveUserInitials(item.firstName, item.lastName),
    }));
  }, [remoteAdmins]);

  const createAdminMutation = useMutation({
    mutationFn: (payload) => platformSecurityApi.createSuperAdmin(payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Yangi xodim muvaffaqiyatli yaratildi');
      setForm(null);
      qc.invalidateQueries({ queryKey: ['platform-security-super-admins'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Xodimni yaratishda xatolik yuz berdi'),
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({ id, payload }) => platformSecurityApi.updateSuperAdmin(id, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Xodim ma’lumotlari yangilandi');
      setForm(null);
      qc.invalidateQueries({ queryKey: ['platform-security-super-admins'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Saqlashda xatolik yuz berdi'),
  });

  const openCreate = () => {
    setForm(emptyStaffForm());
  };

  const openEdit = (staffItem) => {
    setForm({
      mode: 'edit',
      id: staffItem.id,
      firstName: staffItem.firstName ?? '',
      lastName: staffItem.lastName ?? '',
      username: staffItem.username ?? '',
      email: staffItem.email ?? '',
      role: staffItem.role ?? 'PLATFORM_ADMIN',
      twoFactor: !!staffItem.twoFactor,
      mustChangePassword: false,
      isActive: staffItem.status === 'active',
      password: '',
    });
  };

  const closeForm = () => setForm(null);

  const updateField = (field, value) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const cycleTempPassword = () => {
    setTempPwIndex((prev) => (prev + 1) % TEMP_PASSWORDS.length);
  };

  const currentTempPassword = TEMP_PASSWORDS[tempPwIndex];

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form) return;

    if (form.mode === 'create') {
      createAdminMutation.mutate({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password || currentTempPassword,
        role: form.role,
      });
      return;
    }

    updateAdminMutation.mutate({
      id: form.id,
      payload: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password ? form.password : undefined,
      },
    });
  };

  const isSaving = createAdminMutation.isPending || updateAdminMutation.isPending;

  return {
    staffList,
    isLoading,
    permissionsMatrix: PERMISSIONS_MATRIX_ROWS,
    form,
    openCreate,
    openEdit,
    closeForm,
    updateField,
    handleSubmit,
    isSaving,
    currentTempPassword,
    cycleTempPassword,
  };
}
