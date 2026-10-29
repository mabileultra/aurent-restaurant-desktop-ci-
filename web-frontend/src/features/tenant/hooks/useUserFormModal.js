import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi, storeApi, userApi } from '../../../api';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { useAuthStore } from '../../../store/authStore';
import { useTenantScope } from '../../../hooks/useTenantScope';
import {
  asStoreList,
  cashierStoreSet,
  toStoreIdSet,
} from '../utils/userFormModalUtils';
import { asEntityList } from '../utils/companySelectOptions';
import { normalizePhoneToE164 } from '../utils/phoneFormatUtils';
import { companyHasBusinessType } from '../../platform/utils/moduleAccessByBusinessType';
import { resolveUserFormRoles } from '../../platform/utils/rolesByBusinessType';

export function useUserFormModal({
  open,
  onClose,
  isPlatform,
  mode,
  editingUser,
  allowedRoles,
  defaultStoreIds,
  businessTypeFilter = '',
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { tenantKey } = useTenantScope();
  const authCompanyId = useAuthStore((s) => s.user?.companyId ?? null);
  const authCompanyName = useAuthStore((s) => s.user?.companyName ?? null);
  const isEdit = mode === 'edit';
  const user = isEdit ? editingUser : null;

  const [storeIds, setStoreIds] = useState(() => new Set());
  const [companyId, setCompanyId] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pinDirty, setPinDirty] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const createCredentialsRef = useRef(null);
  const initialCompanyRef = useRef('');
  const initialStoresRef = useRef(new Set());

  const form = useForm({
    defaultValues: {
      role: '',
      firstName: '',
      lastName: '',
      patronymic: '',
      username: '',
      email: '',
      phone: '',
      pin: '',
      password: '',
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = form;
  const selectedRole = watch('role');
  const fieldOn = useTenantDisplayStore((s) => s.isUserFormFieldOn);

  const { data: companiesRaw = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled: isPlatform && open,
  });
  const companies = useMemo(() => {
    const list = asEntityList(companiesRaw);
    if (!isPlatform || !businessTypeFilter) return list;
    return list.filter((company) => companyHasBusinessType(company, businessTypeFilter));
  }, [companiesRaw, isPlatform, businessTypeFilter]);

  const { data: storesRaw, isLoading: storesLoading, isError: storesError } = useQuery({
    queryKey: isPlatform
      ? ['stores', 'platform-user-form', companyId || 'none']
      : tenantKey('stores-user-form'),
    queryFn: async () => {
      const params = { page: 0, size: 500 };
      if (isPlatform && companyId) {
        params.companyId = Number(companyId);
      }
      const res = await storeApi.getManaged(params);
      return res.data?.content ?? [];
    },
    enabled: open && (isPlatform ? Boolean(companyId) : authCompanyId != null),
    staleTime: 0,
  });

  const stores = asStoreList(storesRaw);

  const selectedCompany = useMemo(() => {
    if (!isPlatform) return null;
    const id = isEdit ? user?.companyId : companyId ? Number(companyId) : null;
    if (!id) return null;
    return companies.find((c) => Number(c.id) === Number(id))
      ?? asEntityList(companiesRaw).find((c) => Number(c.id) === Number(id))
      ?? null;
  }, [isPlatform, isEdit, user?.companyId, companyId, companies, companiesRaw]);

  const roleAllowList = useMemo(
    () => resolveUserFormRoles({
      allowedRoles,
      isPlatform,
      companyBusinessType: selectedCompany?.businessType,
      filterBusinessType: businessTypeFilter,
    }),
    [allowedRoles, isPlatform, selectedCompany?.businessType, businessTypeFilter],
  );
  const defaultCreateRole = roleAllowList[0] ?? (isPlatform ? 'ADMIN' : 'MANAGER');
  const isCashierRole = selectedRole === 'CASHIER' || selectedRole === 'WAITER';
  const isPinRole = isCashierRole || selectedRole === 'COOK';
  const pinRequired = !isEdit || (isPinRole && user?.role !== 'CASHIER' && user?.role !== 'WAITER' && user?.role !== 'COOK');
  // Non-PIN roles (company ADMIN): username + password editable on create and edit.
  const showPasswordField = !isPinRole;

  const pinFieldLabel = useMemo(() => {
    if (selectedRole === 'COOK') return t('users.pinCook', { defaultValue: 'Oshpaz PIN-kodi' });
    if (selectedRole === 'WAITER') return t('users.pinWaiter', { defaultValue: 'Ofitsiant PIN-kodi' });
    if (selectedRole === 'CASHIER') return t('users.pinCashier', { defaultValue: 'Kassir PIN-kodi' });
    return t('users.pin', { defaultValue: 'PIN-kod' });
  }, [selectedRole, t]);

  const companyLoginCode =
    (isEdit ? user?.companyLoginCode : selectedCompany?.loginCode) || null;

  const filteredStores = useMemo(() => {
    if (!isPlatform) return stores;
    if (!companyId) return [];
    return stores.filter((s) => String(s.companyId) === String(companyId));
  }, [stores, companyId, isPlatform]);

  const storeOptions = useMemo(() => {
    const source = isPlatform ? filteredStores : stores;
    const base = source.filter((s) => s.active !== false);
    if (!isEdit || !user) return base;

    const assignedIds = Array.isArray(user.storeIds) ? user.storeIds : [];
    if (assignedIds.length === 0) return base;

    const known = new Set(base.map((s) => Number(s.id)));
    const names = Array.isArray(user.storeNames) ? user.storeNames : [];
    const extras = assignedIds
      .map((id, idx) => ({
        id: Number(id),
        name: names[idx] ?? `#${id}`,
        active: false,
      }))
      .filter((s) => !Number.isNaN(s.id) && !known.has(s.id));

    return [...base, ...extras];
  }, [isPlatform, filteredStores, stores, isEdit, user]);

  const formInitializedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
      setPasswordVisible(false);
      setPinDirty(false);
      return;
    }
    if (formInitializedRef.current) return;
    if (isEdit && !user?.id) return;

    formInitializedRef.current = true;
    setPinDirty(false);

    if (isEdit) {
      const role = user.role ?? 'MANAGER';
      let initialStores = toStoreIdSet(user.storeIds);
      if (
        initialStores.size === 0
        && (role === 'CASHIER' || role === 'WAITER')
        && Array.isArray(defaultStoreIds)
        && defaultStoreIds.length > 0
      ) {
        initialStores = toStoreIdSet(defaultStoreIds);
      }
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        patronymic: user.patronymic ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        role,
        pin: '',
        password: '',
      });
      const finalStores = role === 'CASHIER' || role === 'WAITER' ? cashierStoreSet(initialStores) : initialStores;
      setStoreIds(finalStores);
      setCompanyId(user.companyId != null ? String(user.companyId) : '');
      initialCompanyRef.current = user.companyId != null ? String(user.companyId) : '';
      initialStoresRef.current = new Set(finalStores);
    } else {
      const initialStores = Array.isArray(defaultStoreIds)
        ? new Set(defaultStoreIds.map(Number).filter((id) => !Number.isNaN(id)))
        : new Set();
      reset({
        role: '',
        firstName: '',
        lastName: '',
        patronymic: '',
        username: '',
        email: '',
        phone: '',
        pin: '',
        password: '',
      });
      setStoreIds(initialStores);
      setCompanyId('');
      initialCompanyRef.current = '';
      initialStoresRef.current = new Set(initialStores);
    }
  }, [open, isEdit, user?.id, isPlatform, reset, defaultStoreIds]);

  useEffect(() => {
    if (!open || isEdit) return;
    const available = (isPlatform ? filteredStores : stores).filter((s) => s.active !== false);
    if (available.length === 1 && storeIds.size === 0) {
      setStoreIds(new Set([Number(available[0].id)]));
    }
  }, [open, isEdit, isPlatform, filteredStores, stores, storeIds.size]);

  useEffect(() => {
    if (!isCashierRole) return;
    setStoreIds((prev) => (prev.size > 1 ? cashierStoreSet(prev) : prev));
  }, [isCashierRole]);

  useEffect(() => {
    if (!open || !roleAllowList.length) return;
    if (!selectedRole) return;
    if (roleAllowList.includes(selectedRole)) return;
    setValue('role', roleAllowList[0], { shouldDirty: !isEdit, shouldValidate: true });
  }, [open, roleAllowList, selectedRole, setValue, isEdit]);

  const { mutate: saveUser, isPending } = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        if (!user?.id) return Promise.reject(new Error('User id missing'));
        return userApi.update(user.id, payload).then((r) => r.data);
      }
      return userApi.create(payload).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['rst-staff-users'] });
      if (!isEdit && isPlatform && createCredentialsRef.current) {
        setCreatedCredentials(createCredentialsRef.current);
        createCredentialsRef.current = null;
        onClose();
        return;
      }
      toast.success(isEdit ? t('users.updated') : t('users.created'));
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message ?? (isEdit ? t('users.updateFailed') : t('users.createFailed'))),
  });

  const toggleStore = (id) => {
    const storeId = Number(id);
    if (Number.isNaN(storeId)) return;
    if (isCashierRole) {
      setStoreIds(new Set([storeId]));
      return;
    }
    setStoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const onSubmit = (data) => {
    const role = data.role;
    const username = data.username?.trim() ?? '';
    const pin = String(data.pin ?? '').trim();
    const firstName = fieldOn('firstName') ? data.firstName?.trim() : username;
    const lastName = fieldOn('lastName') ? data.lastName?.trim() : '—';
    const patronymic = fieldOn('patronymic') ? data.patronymic?.trim() || null : null;
    const rawEmail = data.email?.trim() || '';
    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      toast.error(t('validation.invalidEmail', { defaultValue: 'Email manzili noto\'g\'ri kiritildi' }));
      return;
    }
    const email = rawEmail || `${username}@pos.internal`;
    const rawPhone = data.phone?.trim() || '';
    const phone = rawPhone ? normalizePhoneToE164(rawPhone) : undefined;
    if (phone && phone.replace(/\D/g, '').length !== 12) {
      toast.error(t('validation.invalidPhone', { defaultValue: 'Telefon raqami to‘liq kiritilmadi (+998 XX XXX-XX-XX)' }));
      return;
    }
    let selectedStoreIds = Array.from(storeIds).map(Number).filter((n) => !Number.isNaN(n));

    if (isCashierRole) {
      if (selectedStoreIds.length === 0) {
        toast.error(t('users.cashierStoreRequired'));
        return;
      }
      if (selectedStoreIds.length > 1) {
        selectedStoreIds = [selectedStoreIds[0]];
      }
    }
    if (isPinRole) {
      if (pinRequired && (!pin || pin.replace(/\D/g, '').length < 4)) {
        toast.error(t('users.pinRequired', { defaultValue: 'PIN обязателен (4–6 цифр)' }));
        return;
      }
      if (!pinRequired && pin && pin.replace(/\D/g, '').length > 0 && pin.replace(/\D/g, '').length < 4) {
        toast.error(t('users.pinRequired', { defaultValue: 'PIN обязателен (4–6 цифр)' }));
        return;
      }
    } else if (!isEdit) {
      const pwd = String(data.password || '').trim();
      if (pwd.length < 6) {
        toast.error(t('users.passwordMinLength'));
        return;
      }
    }

    if (!username) {
      toast.error(t('validation.required'));
      return;
    }

    if (isPlatform && !isEdit && !companyId) {
      toast.error(t('users.companyRequired'));
      return;
    }

    if (!role) {
      toast.error(t('users.roleRequired', { defaultValue: 'Rolni tanlash majburiy' }));
      return;
    }

    if (isEdit) {
      const newPassword = data.password?.trim() ?? '';
      if (newPassword.length > 0 && newPassword.length < 6) {
        toast.error(t('users.passwordMinLength'));
        return;
      }
      const pinDigits = pin.replace(/\D/g, '');
      const shouldSendPin = pinDirty && pinDigits.length > 0;
      if (shouldSendPin && (pinDigits.length < 4 || pinDigits.length > 6)) {
        toast.error(t('users.pinRequired', { defaultValue: 'PIN обязателен (4–6 цифр)' }));
        return;
      }
      const payload = {
        username,
        ...(shouldSendPin ? { pin: pinDigits } : {}),
        firstName,
        lastName,
        patronymic,
        email,
        role,
        ...(phone ? { phone } : {}),
        companyId: isPlatform && companyId ? Number(companyId) : undefined,
        storeIds: selectedStoreIds,
      };
      if (newPassword.length >= 6) {
        payload.password = newPassword;
      }
      saveUser(payload);
      return;
    }

    const pwd = String(data.password || '').trim();
    saveUser({
      firstName,
      lastName,
      patronymic,
      username,
      email,
      ...(phone ? { phone } : {}),
      pin: isPinRole ? pin : undefined,
      ...(isPinRole || pwd.length === 0 ? {} : { password: pwd }),
      role,
      companyId: isPlatform && companyId ? Number(companyId) : undefined,
      storeIds: selectedStoreIds,
    });
    if (isPlatform) {
      createCredentialsRef.current = {
        username,
        password: isPinRole ? null : String(data.password || '').trim(),
        pin: isPinRole ? pin : null,
        role,
        companyLoginCode,
      };
    }
  };

  const fioFields = [
    { name: 'lastName', label: t('users.lastName'), key: 'lastName', required: true },
    { name: 'firstName', label: t('users.firstName'), key: 'firstName', required: true },
    { name: 'patronymic', label: t('users.patronymic'), key: 'patronymic', required: false },
  ].filter((f) => fieldOn(f.key));

  const dismissCredentials = () => {
    setCreatedCredentials(null);
    toast.success(t('users.created'));
  };

  const selectedStoreId = storeIds.size > 0 ? String([...storeIds][0]) : '';

  const isCompanyDirty = isPlatform && companyId !== initialCompanyRef.current;
  const isStoresDirty = useMemo(() => {
    if (storeIds.size !== initialStoresRef.current.size) return true;
    for (const id of storeIds) {
      if (!initialStoresRef.current.has(id)) return true;
    }
    return false;
  }, [storeIds]);

  const isDirty = form.formState.isDirty || isCompanyDirty || isStoresDirty;

  return {
    t,
    open,
    onClose,
    isPlatform,
    isEdit,
    user,
    isCashierRole,
    isPinRole,
    pinRequired,
    showPasswordField,
    fieldOn,
    companies,
    companyId,
    setCompanyId,
    setStoreIds,
    companyLoginCode,
    passwordVisible,
    setPasswordVisible,
    setPinDirty,
    createdCredentials,
    dismissCredentials,
    register,
    setValue,
    selectedRole,
    roleAllowList,
    handleSubmit,
    errors,
    onSubmit,
    isPending,
    storeIds,
    selectedStoreId,
    storesLoading,
    storesError,
    authCompanyId,
    authCompanyName,
    toggleStore,
    storeOptions,
    fioFields,
    pinFieldLabel,
    isDirty,
    watch,
  };
}
