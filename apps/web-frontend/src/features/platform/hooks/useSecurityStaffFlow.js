import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformSecurityApi } from '../../../api';
import { generateSecurePassword, resolveUserInitials } from '../utils/securityFormatUtils';
import { PERMISSIONS_MATRIX_ROWS } from '../utils/securityConstants';

const emptyStaffForm = () => ({
  mode: 'create',
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'PLATFORM_ADMIN',
});

/**
 * Xavfsizlik "Xodimlar" tabi mantiq hooki.
 */
export function useSecurityStaffFlow() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [currentTempPassword, setCurrentTempPassword] = useState(() => generateSecurePassword(12));

  const { data: remoteAdmins = [], isLoading } = useQuery({
    queryKey: ['platform-security-super-admins'],
    queryFn: () => platformSecurityApi.listSuperAdmins().then((r) => r.data),
  });

  const staffList = useMemo(() => {
    if (Array.isArray(remoteAdmins)) {
      return remoteAdmins.map((item) => ({
        id: item.id,
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        fullName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username,
        username: item.username,
        email: item.email || '',
        role: item.role || 'PLATFORM_ADMIN',
        active: item.active !== false,
        status: item.active !== false ? 'active' : 'inactive',
        initials: resolveUserInitials(item.firstName, item.lastName),
      }));
    }
    return [];
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
    setCurrentTempPassword(generateSecurePassword(12));
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
      password: '',
    });
  };

  const closeForm = () => setForm(null);

  const updateField = (field, value) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const cycleTempPassword = () => {
    setCurrentTempPassword(generateSecurePassword(12));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form) return;

    if (form.mode === 'create') {
      createAdminMutation.mutate({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password ? form.password.trim() : currentTempPassword,
        role: form.role,
      });
      return;
    }

    updateAdminMutation.mutate({
      id: form.id,
      payload: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password && form.password.trim() ? form.password.trim() : undefined,
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
