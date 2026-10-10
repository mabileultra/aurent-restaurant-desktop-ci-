import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { companyApi, platformBusinessTypeApi, storeApi, userApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { companyHasBusinessType } from '../../platform/utils/moduleAccessByBusinessType';
import { isRoleAllowedForBusinessType } from '../../platform/utils/rolesByBusinessType';
import { TENANT_PAGE_SIZE_DEFAULT } from '../constants';
import { asEntityList } from '../utils/companySelectOptions';

export function useUsersPage({ mode = 'tenant' } = {}) {
  const isPlatform = mode === 'platform';
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { tenantKey, tenantReady } = useTenantScope();
  const [formMode, setFormMode] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(TENANT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');

  const modalOpen = formMode !== null;

  const { data: usersRaw = [], isLoading } = useQuery({
    queryKey: isPlatform ? ['users', 'platform'] : tenantKey('users'),
    queryFn: () => userApi.getAll().then((r) => r.data),
    enabled: isPlatform || tenantReady,
  });

  const { data: companiesRaw = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
    enabled: isPlatform,
    staleTime: 60_000,
  });

  const { data: storesRaw = [] } = useQuery({
    queryKey: isPlatform ? ['stores', 'platform-users'] : tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data ?? []),
    enabled: isPlatform || tenantReady,
    staleTime: 60_000,
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
    enabled: isPlatform,
  });

  const users = useMemo(() => asEntityList(usersRaw), [usersRaw]);
  const companies = useMemo(() => asEntityList(companiesRaw), [companiesRaw]);
  const stores = useMemo(() => asEntityList(storesRaw), [storesRaw]);

  const companyById = useMemo(() => {
    const map = new Map();
    companies.forEach((company) => {
      if (company?.id == null) return;
      map.set(String(company.id), company);
    });
    return map;
  }, [companies]);

  const storeById = useMemo(() => {
    const map = new Map();
    stores.forEach((store) => {
      if (store?.id == null) return;
      map.set(String(store.id), store);
    });
    return map;
  }, [stores]);

  const displayUsers = useMemo(() => users.map((user) => {
    const company = companyById.get(String(user.companyId ?? ''));
    const rawStoreIds = Array.isArray(user.storeIds)
      ? user.storeIds
      : Array.isArray(user.stores)
        ? user.stores.map((s) => (s && typeof s === 'object' ? s.id : s))
        : [];
    const fromApiNames = Array.isArray(user.storeNames)
      ? user.storeNames.filter(Boolean)
      : [];
    const fromIds = rawStoreIds
      .map((id) => storeById.get(String(id))?.name)
      .filter(Boolean);
    const storeNames = fromApiNames.length ? fromApiNames : fromIds;
    return {
      ...user,
      companyName: user.companyName || company?.name || '',
      companyLoginCode: user.companyLoginCode || company?.loginCode || '',
      regionCode: company?.regionCode || '',
      districtCode: company?.districtCode || '',
      storeNames,
    };
  }), [users, companyById, storeById]);

  const { mutate: toggleUser } = useMutation({
    mutationFn: (id) => userApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.updated'));
      setMenuId(null);
    },
  });

  const { mutate: deleteUser, isPending: isDeletePending } = useMutation({
    mutationFn: (id) => userApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.deleted'));
      setDeleteTarget(null);
      setMenuId(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? t('users.deleteFailed'));
    },
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return displayUsers.filter((user) => {
      if (businessType) {
        const company = companyById.get(String(user.companyId ?? ''));
        if (!companyHasBusinessType(company, businessType)) return false;
        if (!isRoleAllowedForBusinessType(user.role, businessType)) return false;
      }
      if (regionCode && String(user.regionCode || '') !== regionCode) return false;
      if (districtCode && String(user.districtCode || '') !== districtCode) return false;
      if (!q) return true;
      return [
        user.fullName,
        user.username,
        user.email,
        user.role,
        user.companyName,
        user.companyLoginCode,
        ...(user.storeNames ?? []),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [displayUsers, search, businessType, companyById, regionCode, districtCode]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const pageRows = useMemo(() => {
    const start = page * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const openCreate = () => {
    setMenuId(null);
    setFormMode('create');
  };

  const openEdit = (row) => {
    setMenuId(null);
    setFormMode({ type: 'edit', user: row });
  };

  const closeModal = () => setFormMode(null);

  const openDelete = (row) => {
    setMenuId(null);
    setDeleteTarget(row);
  };

  const closeDelete = () => setDeleteTarget(null);

  const confirmDelete = () => {
    if (deleteTarget?.id) deleteUser(deleteTarget.id);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleBusinessTypeChange = (code) => {
    setBusinessType(code || '');
    setPage(0);
  };

  const handleGeoChange = ({ regionCode: nextRegion = '', districtCode: nextDistrict = '' }) => {
    setRegionCode(nextRegion || '');
    setDistrictCode(nextDistrict || '');
    setPage(0);
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(0);
  };

  const subtitle = t('common.systemUsers', { count: users.length });
  const searchSuffix = search.trim() || businessType || regionCode || districtCode
    ? ` · ${t('platform.searchResults', { count: filteredUsers.length })}`
    : '';

  return {
    t,
    isPlatform,
    formMode,
    modalOpen,
    menuId,
    setMenuId,
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
    search,
    businessType,
    businessTypes,
    regionCode,
    districtCode,
    isLoading,
    pageRows,
    total,
    totalPages,
    openCreate,
    openEdit,
    closeModal,
    handleSearchChange,
    handleBusinessTypeChange,
    handleGeoChange,
    companyById,
    toggleUser,
    deleteTarget,
    openDelete,
    closeDelete,
    confirmDelete,
    isDeletePending,
    subtitle: `${subtitle}${searchSuffix}`,
    title: isPlatform ? t('platform.usersTitle') : t('users.title'),
    editingUser: formMode?.type === 'edit' ? formMode.user : undefined,
    modalMode: formMode === 'create' ? 'create' : 'edit',
  };
}
