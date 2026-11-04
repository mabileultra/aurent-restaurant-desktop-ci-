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
import { toastApiError } from '../../../utils/apiError';

export function useUserFormModal({ open, onClose, isPlatform, mode, editingUser, allowedRoles, defaultStoreIds }) {
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

  const form = useForm({
    defaultValues: {
      role: isPlatform ? 'ADMIN' : 'MANAGER',
      firstName: '',
      lastName: '',
      patronymic: '',
      username: '',
      email: '',
      pin: '',
      password: '',
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = form;
  const selectedRole = watch('role');
  const roleAllowList = Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : null;
  const defaultCreateRole = roleAllowList?.[0] ?? (isPlatform ? 'ADMIN' : 'MANAGER');
  const isCashierRole = selectedRole === 'CASHIER' || selectedRole === 'WAITER';
  const isPinRole = isCashierRole || selectedRole === 'COOK' || selectedRole === 'MANAGER';
  const fieldOn = useTenantDisplayStore((s) => s.isUserFormFieldOn);
  const hadPinRole = user?.role === 'CASHIER' || user?.role === 'WAITER'
    || user?.role === 'COOK' || user?.role === 'MANAGER';
  // Create / role→PIN / existing user without PIN yet → PIN required.
  const pinRequired = !isEdit || (isPinRole && (!hadPinRole || user?.hasPin === false));
  // Non-PIN roles (company ADMIN): username + password editable on create and edit.
  const showPasswordField = !isPinRole;

  const { data: companiesRaw = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled: isPlatform && open,
  });
  const companies = useMemo(() => asEntityList(companiesRaw), [companiesRaw]);

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
    return companies.find((c) => Number(c.id) === Number(id)) ?? null;
  }, [isPlatform, isEdit, user?.companyId, companyId, companies]);

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
      // Staff page filters by current store; if API omitted storeIds, keep assignment on this store.
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
        role,
        pin: '',
        password: '',
      });
      setStoreIds(role === 'CASHIER' || role === 'WAITER' ? cashierStoreSet(initialStores) : initialStores);
      setCompanyId(user.companyId != null ? String(user.companyId) : '');
    } else {
      const initialStores = Array.isArray(defaultStoreIds)
        ? new Set(defaultStoreIds.map(Number).filter((id) => !Number.isNaN(id)))
        : new Set();
      reset({
        role: defaultCreateRole,
        firstName: '',
        lastName: '',
        patronymic: '',
        username: '',
        email: '',
        pin: '',
        password: '',
      });
      setStoreIds(initialStores);
      setCompanyId('');
    }
  }, [open, isEdit, user?.id, isPlatform, reset, defaultCreateRole, defaultStoreIds]);

  useEffect(() => {
    if (!isCashierRole) return;
    setStoreIds((prev) => (prev.size > 1 ? cashierStoreSet(prev) : prev));
  }, [isCashierRole]);

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
      toastApiError(err, isEdit ? t('users.updateFailed') : t('users.createFailed')),
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
    const email = fieldOn('email') ? data.email.trim() : `${username}@example.com`;
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
      toast.error(t('validation.fieldRequired', { field: t('users.role') }));
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
    { name: 'lastName', label: t('users.lastName'), key: 'lastName' },
    { name: 'firstName', label: t('users.firstName'), key: 'firstName' },
    { name: 'patronymic', label: t('users.patronymic'), key: 'patronymic' },
  ].filter((f) => fieldOn(f.key));

  const dismissCredentials = () => {
    setCreatedCredentials(null);
    toast.success(t('users.created'));
  };

  const selectedStoreId = storeIds.size > 0 ? String([...storeIds][0]) : '';

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
    pinDirty,
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
  };
}
