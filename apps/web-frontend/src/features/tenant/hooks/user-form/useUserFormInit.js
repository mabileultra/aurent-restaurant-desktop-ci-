import { useEffect, useRef } from 'react';
import { cashierStoreSet, toStoreIdSet } from '../../utils/userFormModalUtils';

/**
 * useUserFormInit
 * Synchronizes react-hook-form values, storeIds and companyId on open/edit.
 */
export function useUserFormInit({
  open,
  isEdit,
  user,
  defaultStoreIds,
  reset,
  setStoreIds,
  setCompanyId,
  setPasswordVisible,
  setPinDirty,
  usernameManuallyEditedRef,
  initialCompanyRef,
  initialStoresRef,
}) {
  const formInitializedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
      setPasswordVisible(false);
      setPinDirty(false);
      if (usernameManuallyEditedRef) usernameManuallyEditedRef.current = false;
      return;
    }
    if (formInitializedRef.current) return;
    if (isEdit && !user?.id) return;

    formInitializedRef.current = true;
    setPinDirty(false);

    if (isEdit) {
      if (usernameManuallyEditedRef) usernameManuallyEditedRef.current = true;
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
      if (usernameManuallyEditedRef) usernameManuallyEditedRef.current = false;
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
      initialStoresRef.current = new Set();
    }
  }, [
    open,
    isEdit,
    user,
    defaultStoreIds,
    reset,
    setStoreIds,
    setCompanyId,
    setPasswordVisible,
    setPinDirty,
    usernameManuallyEditedRef,
    initialCompanyRef,
    initialStoresRef,
  ]);
}
