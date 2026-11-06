import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { useAuthStore } from '../../../store/authStore';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useUserFormStoreData } from './user-form/useUserFormStoreData';
import { useUserFormRoleConfig } from './user-form/useUserFormRoleConfig';
import { useUserFormSubmit } from './user-form/useUserFormSubmit';
import { useUserFormInit } from './user-form/useUserFormInit';
import { useUserUsernameSuggest } from './user-form/useUserUsernameSuggest';
import { useUserFormDirty } from './user-form/useUserFormDirty';

const DEFAULT_FORM_VALUES = {
  role: '', firstName: '', lastName: '', patronymic: '',
  username: '', email: '', phone: '', pin: '', password: '',
};

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
  const usernameManuallyEditedRef = useRef(false);

  const form = useForm({ shouldFocusError: false, defaultValues: DEFAULT_FORM_VALUES });
  const { register, handleSubmit, reset, watch, setValue, setError, clearErrors, formState: { errors } } = form;
  const selectedRole = watch('role');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const fieldOn = useTenantDisplayStore((s) => s.isUserFormFieldOn);

  useUserUsernameSuggest({ open, isEdit, firstName, lastName, setValue, clearErrors, usernameManuallyEditedRef });
  const storeData = useUserFormStoreData({ open, isPlatform, isEdit, user, companyId, authCompanyId, tenantKey, businessTypeFilter });
  const roleConfig = useUserFormRoleConfig({ t, isPlatform, isEdit, user, companyId, companies: storeData.companies, companiesRaw: storeData.companiesRaw, allowedRoles, businessTypeFilter, selectedRole });

  useUserFormInit({
    open, isEdit, user, defaultStoreIds, reset, setStoreIds, setCompanyId,
    setPasswordVisible, setPinDirty, usernameManuallyEditedRef, initialCompanyRef, initialStoresRef,
  });

  useEffect(() => {
    if (!open || !roleConfig.roleAllowList.length) return;
    if (!selectedRole || roleConfig.roleAllowList.includes(selectedRole)) return;
    setValue('role', roleConfig.roleAllowList[0], { shouldDirty: !isEdit, shouldValidate: true });
  }, [open, roleConfig.roleAllowList, selectedRole, setValue, isEdit]);

  const toggleStore = (id) => {
    const storeId = Number(id);
    if (Number.isNaN(storeId)) return;
    if (roleConfig.isCashierRole) {
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

  const submitActions = useUserFormSubmit({
    isEdit, user, isPlatform, companyId, companyLoginCode: roleConfig.companyLoginCode,
    storeIds, isCashierRole: roleConfig.isCashierRole, isPinRole: roleConfig.isPinRole,
    pinRequired: roleConfig.pinRequired, pinDirty, fieldOn, setError, handleSubmit,
    selectedRole, onClose, createCredentialsRef, setCreatedCredentials, t,
  });

  const isDirty = useUserFormDirty({
    formIsDirty: form.formState.isDirty, isPlatform, companyId, initialCompanyRef, storeIds, initialStoresRef,
  });

  return {
    t, open, onClose, isPlatform, isEdit, user, ...roleConfig, ...storeData,
    fieldOn, companyId, setCompanyId,
    handleCompanyChange: (val) => { setCompanyId(val); if (val) clearErrors('companyId'); },
    handleRoleChange: (val) => { setValue('role', val, { shouldDirty: true, shouldValidate: true }); if (val) clearErrors('role'); },
    setStoreIds, passwordVisible, setPasswordVisible, setPinDirty, createdCredentials,
    dismissCredentials: () => { setCreatedCredentials(null); toast.success(t('users.created')); },
    register, setValue, clearErrors, setError, selectedRole, handleSubmit, errors,
    storeIds, selectedStoreId: storeIds.size > 0 ? String([...storeIds][0]) : '',
    authCompanyId, authCompanyName, toggleStore,
    fioFields: [
      { name: 'lastName', label: t('users.lastName'), key: 'lastName', required: true },
      { name: 'firstName', label: t('users.firstName'), key: 'firstName', required: true },
      { name: 'patronymic', label: t('users.patronymic'), key: 'patronymic', required: false },
    ].filter((f) => fieldOn(f.key)),
    isDirty, watch,
    onUsernameChange: () => { usernameManuallyEditedRef.current = true; },
    ...submitActions,
  };
}
