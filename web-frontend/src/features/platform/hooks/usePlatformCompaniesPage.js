import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi } from '../../../api/company.api';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import { platformBusinessTypeApi } from '../../../api';

export const PLATFORM_COMPANY_PAGE_SIZE = 14;
export const PLATFORM_COMPANY_PAGE_SIZE_OPTIONS = [10, 14, 20, 50];

const emptyForm = () => ({
  name: '',
  legalName: '',
  tin: '',
  address: '',
  phone: '',
  active: true,
  businessType: 'UNIVERSAL',
  businessTypeIds: [],
  defaultBusinessTypeId: null,
});

export function usePlatformCompaniesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PLATFORM_COMPANY_PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [menuId, setMenuId] = useState(null);

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      businessType: businessType || undefined,
    }),
    [page, pageSize, search, businessType]
  );

  const { data, isPending } = useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyApi.getAll(params).then((r) => r.data),
  });

  const { data: constructorTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const {
        name,
        legalName,
        tin,
        address,
        phone,
        active,
        businessType,
        businessTypeIds,
        defaultBusinessTypeId,
      } = form;

      const defaultType = constructorTypes.find((bt) => bt.id === defaultBusinessTypeId)
        ?? constructorTypes.find((bt) => businessTypeIds.includes(bt.id))
        ?? constructorTypes.find((bt) => bt.code === businessType);

      const payload = {
        name,
        legalName,
        tin,
        address,
        phone,
        active,
        businessType: defaultType?.code ?? businessType,
      };

      const companyRes = editing
        ? await companyApi.update(editing.id, payload)
        : await companyApi.create(payload);

      const companyId = editing?.id ?? companyRes.data?.id;
      if (companyId && businessTypeIds.length > 0) {
        const assigned = await companyBusinessTypeApi.setForCompany(companyId, {
          businessTypeIds,
          defaultBusinessTypeId: defaultBusinessTypeId ?? businessTypeIds[0],
        }).then((r) => r.data);
        const syncedType = assigned?.defaultTypeCode || defaultType?.code;
        if (syncedType && String(syncedType).toUpperCase() !== String(payload.businessType || '').toUpperCase()) {
          await companyApi.update(companyId, { businessType: syncedType });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['companies-all'] });
      qc.invalidateQueries({ queryKey: ['company-business-types'] });
      toast.success(t('platform.companySaved'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(t('platform.companyDeleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const fromN = total === 0 ? 0 : page * pageSize + 1;
  const toN = Math.min((page + 1) * pageSize, total);

  const openCreate = () => {
    setEditing(null);
    const universal = constructorTypes.find((bt) => bt.code === 'UNIVERSAL');
    setForm({
      ...emptyForm(),
      businessTypeIds: universal ? [universal.id] : [],
      defaultBusinessTypeId: universal?.id ?? null,
    });
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    setEditing(row);
    let businessTypeIds = [];
    let defaultBusinessTypeId = null;
    try {
      const assigned = await companyBusinessTypeApi.getForCompany(row.id).then((r) => r.data);
      businessTypeIds = assigned.types?.map((bt) => bt.id) ?? [];
      defaultBusinessTypeId = assigned.types?.find((bt) => bt.defaultType)?.id
        ?? businessTypeIds[0]
        ?? null;
    } catch {
      const fallback = constructorTypes.find((bt) => bt.code === (row.businessType ?? 'UNIVERSAL'));
      if (fallback) {
        businessTypeIds = [fallback.id];
        defaultBusinessTypeId = fallback.id;
      }
    }
    setForm({
      name: row.name,
      legalName: row.legalName ?? '',
      tin: row.tin ?? '',
      address: row.address ?? '',
      phone: row.phone ?? '',
      active: row.active,
      businessType: row.businessType ?? 'UNIVERSAL',
      businessTypeIds,
      defaultBusinessTypeId,
    });
    setModalOpen(true);
    setMenuId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBusinessType = (typeId) => {
    setForm((prev) => {
      const exists = prev.businessTypeIds.includes(typeId);
      const businessTypeIds = exists
        ? prev.businessTypeIds.filter((id) => id !== typeId)
        : [...prev.businessTypeIds, typeId];
      let defaultBusinessTypeId = prev.defaultBusinessTypeId;
      if (!businessTypeIds.includes(defaultBusinessTypeId)) {
        defaultBusinessTypeId = businessTypeIds[0] ?? null;
      }
      if (!exists && businessTypeIds.length === 1) {
        defaultBusinessTypeId = typeId;
      }
      const defaultType = constructorTypes.find((bt) => bt.id === defaultBusinessTypeId);
      return {
        ...prev,
        businessTypeIds,
        defaultBusinessTypeId,
        businessType: defaultType?.code ?? prev.businessType,
      };
    });
  };

  const setDefaultBusinessType = (typeId) => {
    setForm((prev) => {
      const defaultType = constructorTypes.find((bt) => bt.id === typeId);
      return {
        ...prev,
        defaultBusinessTypeId: typeId,
        businessType: defaultType?.code ?? prev.businessType,
      };
    });
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleBusinessTypeChange = (code) => {
    setBusinessType(code || '');
    setPage(0);
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(0);
  };

  const tryDelete = (row) => {
    const stores = row.storeCount ?? 0;
    if (stores > 0) {
      toast.error(t('platform.deleteCompanyBlockedStores', { count: stores }));
      return;
    }
    if (window.confirm(t('platform.deleteCompanyConfirm'))) {
      deleteMutation.mutate(row.id);
    }
  };

  return {
    t,
    search,
    businessType,
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
    modalOpen,
    editing,
    form,
    menuId,
    setMenuId,
    rows,
    isPending,
    total,
    totalPages,
    fromN,
    toN,
    businessTypes: constructorTypes,
    saveMutation,
    openCreate,
    openEdit,
    closeModal,
    updateField,
    toggleBusinessType,
    setDefaultBusinessType,
    handleSearchChange,
    handleBusinessTypeChange,
    tryDelete,
  };
}
