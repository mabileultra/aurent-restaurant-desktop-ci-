import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyApi, storeApi } from '../../../../api';
import { asEntityList } from '../../utils/companySelectOptions';
import { asStoreList } from '../../utils/userFormModalUtils';

/**
 * useUserFormStoreData
 * Manages company list, store queries, and computes store options.
 */
export function useUserFormStoreData({
  open,
  isPlatform,
  isEdit,
  user,
  companyId,
  authCompanyId,
  tenantKey,
  businessTypeFilter,
}) {
  const { data: companiesRaw = [] } = useQuery({
    queryKey: ['companies-options', 'user-form', businessTypeFilter || 'ALL'],
    queryFn: async () => {
      const { data } = await companyApi.getAll({
        page: 0,
        size: 300,
        businessType: businessTypeFilter || undefined,
      });
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
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

  return {
    companiesRaw,
    companies,
    stores,
    storesLoading,
    storesError,
    filteredStores,
    storeOptions,
  };
}
