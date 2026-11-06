import { useEffect } from 'react';
import { transliterateCyrillicToLatin } from '../../../../utils/transliterateCyrillic';

/**
 * useUserUsernameSuggest
 * Auto-suggests a latin username based on firstName and lastName in create mode.
 */
export function useUserUsernameSuggest({
  open,
  isEdit,
  firstName,
  lastName,
  setValue,
  clearErrors,
  usernameManuallyEditedRef,
}) {
  useEffect(() => {
    if (isEdit || !open || usernameManuallyEditedRef?.current) return;
    const cleanFirst = transliterateCyrillicToLatin(firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = transliterateCyrillicToLatin(lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    let suggested = '';
    if (cleanFirst && cleanLast) {
      suggested = `${cleanFirst}.${cleanLast}`;
    } else if (cleanFirst) {
      suggested = cleanFirst;
    } else if (cleanLast) {
      suggested = cleanLast;
    }
    setValue('username', suggested, { shouldDirty: Boolean(suggested), shouldValidate: Boolean(suggested) });
    if (suggested) {
      clearErrors('username');
    }
  }, [firstName, lastName, isEdit, open, setValue, clearErrors, usernameManuallyEditedRef]);
}
