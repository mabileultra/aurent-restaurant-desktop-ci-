import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi, platformBusinessTypeApi } from '../../../api';
import { TENANT_PAGE_SIZE_DEFAULT } from '../constants';

export function useStoresPage({ showCompanySelect = false, companyIdFilter, companies = [] } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState(
    companyIdFilter != null && companyIdFilter !== '' ? String(companyIdFilter) : ''
  );
  const [businessType, setBusinessType] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(TENANT_PAGE_SIZE_DEFAULT);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [pharmacyIntegrationStore, setPharmacyIntegrationStore] = useState(null);

  const resolvedCompanyId = showCompanySelect
    ? (companyId ? Number(companyId) : undefined)
    : companyIdFilter;

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      companyId: resolvedCompanyId,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
    }),
    [search, page, pageSize, resolvedCompanyId, businessType, regionCode, districtCode]
  );

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['stores-manage', queryParams],
    queryFn: () => storeApi.getManaged(queryParams).then((r) => r.data),
  });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
    enabled: showCompanySelect,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? storeApi.update(editing.id, payload) : storeApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ predicate: (q) => {
        const key = q.queryKey;
        return Array.isArray(key) && (key.includes('stores-user-form') || key.includes('platform-user-form'));
      }});
      toast.success(editing ? t('stores.updated') : t('stores.created'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => storeApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ predicate: (q) => {
        const key = q.queryKey;
        return Array.isArray(key) && (key.includes('stores-user-form') || key.includes('platform-user-form'));
      }});
      toast.success(t('stores.updated'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ predicate: (q) => {
        const key = q.queryKey;
        return Array.isArray(key) && (key.includes('stores-user-form') || key.includes('platform-user-form'));
      }});
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['companies-all'] });
      toast.success(t('stores.deleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.deleteFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
    setMenuId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleCompanyChange = (value) => {
    setCompanyId(value || '');
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

  const openPharmacyIntegration = (row) => {
    setPharmacyIntegrationStore(row);
    setMenuId(null);
  };

  const closePharmacyIntegration = () => {
    setPharmacyIntegrationStore(null);
  };

  const tryDelete = (row) => {
    if (window.confirm(t('stores.deleteConfirm', { name: row.name }))) {
      deleteMutation.mutate(row.id);
    }
  };

  const errorMessage = error?.response?.data?.message ?? error?.message;

  return {
    t,
    search,
    companyId,
    businessType,
    regionCode,
    districtCode,
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
    modalOpen,
    editing,
    menuId,
    setMenuId,
    rows,
    total,
    totalPages,
    isPending,
    isError,
    error,
    refetch,
    errorMessage,
    showCompanySelect,
    companies,
    businessTypes,
    saveMutation,
    openCreate,
    openEdit,
    closeModal,
    handleSearchChange,
    handleCompanyChange,
    handleBusinessTypeChange,
    handleGeoChange,
    toggleMutation,
    tryDelete,
    pharmacyIntegrationStore,
    openPharmacyIntegration,
    closePharmacyIntegration,
  };
}
