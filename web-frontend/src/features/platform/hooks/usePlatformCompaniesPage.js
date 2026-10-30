import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import { platformBusinessTypeApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';

export const PLATFORM_COMPANY_PAGE_SIZE = 14;
export const PLATFORM_COMPANY_PAGE_SIZE_OPTIONS = [10, 14, 20, 50];

const emptyForm = () => ({
  name: '',
  legalName: '',
  tin: '',
  address: '',
  regionCode: '',
  districtCode: '',
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
  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PLATFORM_COMPANY_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [menuId, setMenuId] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const handleStatusFilterChange = (next) => {
    setStatusFilter(next);
    setPage(0);
  };

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: debouncedSearch.trim() || undefined,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
      active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
    }),
    [page, pageSize, debouncedSearch, businessType, regionCode, districtCode, statusFilter]
  );

  const companiesQuery = useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyApi.getAll(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const { data, error } = companiesQuery;
  const firstLoad = companiesQuery.isPending && !data;
  const isRefreshing = companiesQuery.isFetching && !firstLoad;
  const showRefreshingOverlay = useDelayedLoading(isRefreshing, { delay: 250, minDuration: 400 });

  // Lightweight total stores count (requests only 1 item to obtain totalElements from PageResponse)
  const { data: storeCountData } = useQuery({
    queryKey: ['platform-stores-total-count'],
    queryFn: () => storeApi.getManaged({ page: 0, size: 1 }).then((r) => r.data?.totalElements ?? 0).catch(() => 0),
    staleTime: 60_000,
  });

  // If table is filtered by search or geography, retain baseline total companies count with size: 1
  const isFiltered = Boolean(debouncedSearch.trim() || businessType || regionCode || districtCode);
  const { data: baselineCount } = useQuery({
    queryKey: ['companies-baseline-count'],
    queryFn: () => companyApi.getAll({ page: 0, size: 1 }).then((r) => r.data?.totalElements ?? 0).catch(() => 0),
    enabled: isFiltered,
    staleTime: 60_000,
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
        regionCode,
        districtCode,
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
      // New companies must send geo; legacy edits may omit until filled.
      if (regionCode?.trim() && districtCode?.trim()) {
        payload.regionCode = regionCode.trim();
        payload.districtCode = districtCode.trim();
      } else if (!editing) {
        payload.regionCode = regionCode;
        payload.districtCode = districtCode;
      }

      let companyId = editing?.id ?? null;
      if (!companyId) {
        const companyRes = await companyApi.create(payload);
        companyId = companyRes.data?.id;
      }

      // Assignments drive PIN / r-aurent WorldGate — set them before platform sync of legacy field.
      if (companyId && businessTypeIds.length > 0) {
        const assigned = await companyBusinessTypeApi.setForCompany(companyId, {
          businessTypeIds,
          defaultBusinessTypeId: defaultBusinessTypeId ?? businessTypeIds[0],
        }).then((r) => r.data);
        const syncedType = assigned?.defaultTypeCode || defaultType?.code;
        if (syncedType) {
          payload.businessType = syncedType;
        }
      }

      if (editing?.id) {
        await companyApi.update(editing.id, payload);
      } else if (companyId && payload.businessType !== (defaultType?.code ?? businessType)) {
        await companyApi.update(companyId, { businessType: payload.businessType });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['companies-baseline-count'] });
      qc.invalidateQueries({ queryKey: ['platform-stores-total-count'] });
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
      qc.invalidateQueries({ queryKey: ['companies-baseline-count'] });
      qc.invalidateQueries({ queryKey: ['platform-stores-total-count'] });
      toast.success(t('platform.companyDeleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const rawRows = data?.content ?? [];
  const rows = useMemo(() => {
    if (statusFilter === 'ACTIVE') {
      return rawRows.filter((r) => r.active);
    }
    if (statusFilter === 'INACTIVE') {
      return rawRows.filter((r) => !r.active);
    }
    return rawRows;
  }, [rawRows, statusFilter]);

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  // If data has number, it represents the page index of the rows currently in memory
  const displayPage = typeof data?.number === 'number' ? data.number : page;
  const fromN = total === 0 ? 0 : displayPage * pageSize + 1;
  const toN = Math.min((displayPage + 1) * pageSize, total);

  // Scalable KPI calculations without fetching full datasets into browser memory
  const totalCompanies = isFiltered ? (baselineCount ?? total) : total;
  const rawActive = rawRows.filter((r) => r.active).length;
  const rawInactive = rawRows.filter((r) => !r.active).length;

  let activeCompanies;
  let inactiveCompanies;

  if (statusFilter === 'ACTIVE') {
    activeCompanies = total;
    inactiveCompanies = Math.max(0, totalCompanies - activeCompanies);
  } else if (statusFilter === 'INACTIVE') {
    inactiveCompanies = total;
    activeCompanies = Math.max(0, totalCompanies - inactiveCompanies);
  } else if (total <= rawRows.length) {
    // Current page contains entire dataset: exact counts
    activeCompanies = rawActive;
    inactiveCompanies = rawInactive;
  } else {
    // Multi-page dataset: derive from page ratio / known inactive count
    inactiveCompanies = rawInactive;
    activeCompanies = Math.max(0, totalCompanies - inactiveCompanies);
  }

  const totalStores = storeCountData ?? rawRows.reduce((acc, r) => acc + (r.storeCount || 0), 0);

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
      regionCode: row.regionCode ?? '',
      districtCode: row.districtCode ?? '',
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

  const handleGeoChange = ({ regionCode: nextRegion = '', districtCode: nextDistrict = '' }) => {
    setRegionCode(nextRegion || '');
    setDistrictCode(nextDistrict || '');
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
    regionCode,
    districtCode,
    page,
    displayPage,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
    modalOpen,
    editing,
    form,
    menuId,
    setMenuId,
    rows,
    firstLoad,
    isRefreshing,
    showRefreshingOverlay,
    isPending: firstLoad,
    isError: companiesQuery.isError,
    error,
    refetch: companiesQuery.refetch,
    errorMessage: error?.response?.data?.message ?? t('common.loadError'),
    total,
    totalPages,
    fromN,
    toN,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    selectedCompany,
    setSelectedCompany,
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    totalStores,
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
    handleGeoChange,
    tryDelete,
  };
}
