import { useMemo } from 'react';

/**
 * useUserFormDirty
 * Calculates dirty state considering react-hook-form, company changes, and store assignments.
 */
export function useUserFormDirty({
  formIsDirty,
  isPlatform,
  companyId,
  initialCompanyRef,
  storeIds,
  initialStoresRef,
}) {
  const isCompanyDirty = isPlatform && companyId !== initialCompanyRef.current;

  const isStoresDirty = useMemo(() => {
    if (storeIds.size !== initialStoresRef.current.size) return true;
    for (const id of storeIds) {
      if (!initialStoresRef.current.has(id)) return true;
    }
    return false;
  }, [storeIds, initialStoresRef]);

  return formIsDirty || isCompanyDirty || isStoresDirty;
}
