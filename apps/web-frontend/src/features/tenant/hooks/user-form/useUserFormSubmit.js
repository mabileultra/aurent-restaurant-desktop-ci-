import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userApi } from '../../../../api';
import { validateAndBuildUserPayload } from '../../utils/userPayloadBuilder';
import { translateRawErrorMessage } from '../../../../utils/validationErrorTranslator';

/**
 * useUserFormSubmit
 * Handles user form submission, field validation, mutation, and accessible error focusing.
 */
export function useUserFormSubmit({
  isEdit,
  user,
  isPlatform,
  companyId,
  companyLoginCode,
  storeIds,
  isCashierRole,
  isPinRole,
  pinRequired,
  pinDirty,
  fieldOn,
  setError,
  handleSubmit,
  selectedRole,
  onClose,
  createCredentialsRef,
  setCreatedCredentials,
  t,
}) {
  const qc = useQueryClient();

  const { mutate: saveUser, isPending } = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        if (!user?.id) return Promise.reject(new Error('User id missing'));
        return userApi.update(user.id, payload).then((r) => r.data);
      }
      return userApi.create(payload).then((r) => r.data);
    },
    meta: { suppressGlobalError: true },
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
    onError: (err) => {
      const raw = err.response?.data?.message || err.message;
      const translated = translateRawErrorMessage(raw) || (isEdit ? t('users.updateFailed') : t('users.createFailed'));
      if (/username already taken/i.test(raw)) {
        setError('username', { type: 'manual', message: translated });
      }
      if (/pin already used/i.test(raw)) {
        setError('pin', { type: 'manual', message: translated });
      }
      toast.error(translated);
    },
  });

  const onSubmit = (data) => {
    const result = validateAndBuildUserPayload({
      data,
      role: data.role,
      username: data.username?.trim() ?? '',
      pin: String(data.pin ?? '').trim(),
      storeIds,
      isCashierRole,
      isPinRole,
      pinRequired,
      pinDirty,
      fieldOn,
      isEdit,
      isPlatform,
      companyId,
      t,
    });

    if (!result.valid) {
      if (result.field) {
        setError(result.field, { type: 'manual', message: result.message });
      }
      if (result.message) {
        toast.error(result.message);
      }
      if (result.targetId) {
        document.getElementById(result.targetId)?.focus?.();
      }
      return;
    }

    saveUser(result.payload);

    if (isPlatform && !isEdit) {
      createCredentialsRef.current = {
        username: data.username?.trim() ?? '',
        password: isPinRole ? null : String(data.password || '').trim(),
        pin: isPinRole ? String(data.pin ?? '').trim() : null,
        role: data.role,
        companyLoginCode,
      };
    }
  };

  const handleFormSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    let hasCustomError = false;
    let firstErrorFieldId = null;

    if (isPlatform && !isEdit && !companyId) {
      setError('companyId', {
        type: 'required',
        message: t('users.companyRequired', { defaultValue: 'Kompaniyani tanlang' }),
      });
      hasCustomError = true;
      if (!firstErrorFieldId) firstErrorFieldId = 'user-form-company';
    }

    if (!selectedRole) {
      setError('role', {
        type: 'required',
        message: t('users.roleRequired', { defaultValue: 'Rolni tanlash majburiy' }),
      });
      hasCustomError = true;
      if (!firstErrorFieldId) firstErrorFieldId = 'user-form-role';
    }

    const focusTarget = (id) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.focus?.();
      }, 20);
    };

    handleSubmit(
      (data) => {
        if (hasCustomError) {
          if (firstErrorFieldId) {
            focusTarget(firstErrorFieldId);
          }
          return;
        }
        onSubmit(data);
      },
      (validationErrors) => {
        const order = [
          ...(isPlatform && !isEdit ? [{ name: 'companyId', id: 'user-form-company' }] : []),
          { name: 'role', id: 'user-form-role' },
          { name: 'store', id: 'user-form-store' },
          { name: 'firstName', id: 'user-first-name' },
          { name: 'lastName', id: 'user-last-name' },
          { name: 'username', id: 'user-username' },
          { name: 'phone', id: 'user-phone' },
          { name: 'email', id: 'user-email' },
          { name: 'pin', id: 'user-pin' },
          { name: 'password', id: 'user-password' },
        ];
        const allErrors = {
          ...validationErrors,
          ...(hasCustomError && !companyId && isPlatform && !isEdit ? { companyId: true } : {}),
          ...(hasCustomError && !selectedRole ? { role: true } : {}),
        };
        const firstField = order.find((f) => allErrors[f.name]);
        if (firstField) {
          focusTarget(firstField.id);
        }
      }
    )(e);
  };

  return {
    saveUser,
    isPending,
    onSubmit,
    handleFormSubmit,
  };
}
