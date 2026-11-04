import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi } from '../../../api';
import { normalizeBusinessTypeCode } from '../../../config/productCatalogConfig';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import { toastApiError } from '../../../utils/apiError';

const RST_TYPES = new Set(['RESTAURANT', 'CANTEEN']);

function emptyForm(defaultType = 'RESTAURANT') {
  return {
    name: '',
    code: '',
    address: '',
    phone: '',
    businessType: defaultType,
    active: true,
  };
}

/**
 * Manage restaurant/canteen branches for the current company.
 */
export function useStoresAdminPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const { types: companyTypes, defaultTypeCode } = useCompanyBusinessType();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const restaurantTypeOptions = useMemo(() => {
    const fromCompany = (companyTypes ?? [])
      .filter((bt) => RST_TYPES.has(normalizeBusinessTypeCode(bt.code)))
      .map((bt) => ({
        code: normalizeBusinessTypeCode(bt.code),
        id: bt.id,
        label: bt.name || bt.code,
      }));
    if (fromCompany.length) return fromCompany;
    return [
      { code: 'RESTAURANT', id: null, label: t('rst.admin.storeTypeRestaurant') },
      { code: 'CANTEEN', id: null, label: t('rst.admin.storeTypeCanteen') },
    ];
  }, [companyTypes, t]);

  const defaultType = useMemo(() => {
    const normalized = normalizeBusinessTypeCode(defaultTypeCode);
    if (RST_TYPES.has(normalized)) return normalized;
    return restaurantTypeOptions[0]?.code ?? 'RESTAURANT';
  }, [defaultTypeCode, restaurantTypeOptions]);

  const listQuery = useQuery({
    queryKey: ['rst-stores-manage'],
    queryFn: () => storeApi.getManaged({ page: 0, size: 200 }).then((r) => r.data),
  });

  const rows = useMemo(() => {
    const content = listQuery.data?.content ?? [];
    const q = search.trim().toLowerCase();
    return content
      .filter((row) => RST_TYPES.has(normalizeBusinessTypeCode(row.businessType)))
      .filter((row) => {
        if (!q) return true;
        return [row.name, row.code, row.address, row.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
  }, [listQuery.data, search]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rst-stores-manage'] });
    qc.invalidateQueries({ queryKey: ['stores'] });
    qc.invalidateQueries({ queryKey: ['stores-manage'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (modal?.mode === 'edit' && modal.form?.id != null) {
        return storeApi.update(modal.form.id, payload);
      }
      return storeApi.create(payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(modal?.mode === 'edit' ? t('stores.updated') : t('stores.created'));
      setModal(null);
    },
    onError: (e) => toastApiError(e, t('stores.saveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => storeApi.toggle(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('stores.updated'));
    },
    onError: (e) => toastApiError(e, t('stores.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('stores.deleted'));
    },
    onError: (e) => toastApiError(e, t('stores.deleteFailed')),
  });

  const openCreate = () => setModal({ mode: 'create', form: emptyForm(defaultType) });

  const openEdit = (row) => setModal({
    mode: 'edit',
    form: {
      id: row.id,
      name: row.name ?? '',
      code: row.code ?? '',
      address: row.address ?? '',
      phone: row.phone ?? '',
      businessType: normalizeBusinessTypeCode(row.businessType) || defaultType,
      active: row.active !== false,
    },
  });

  const submit = () => {
    const form = modal?.form;
    if (!form?.name?.trim()) {
      toast.error(t('validation.fieldRequired', { field: t('stores.colName') }));
      return;
    }
    const typeMeta = restaurantTypeOptions.find((o) => o.code === form.businessType);
    saveMutation.mutate({
      name: form.name.trim(),
      code: form.code?.trim() || null,
      address: form.address?.trim() || null,
      phone: form.phone?.trim() || null,
      businessType: form.businessType || defaultType,
      businessTypeId: typeMeta?.id ?? undefined,
      active: form.active !== false,
    });
  };

  const tryDelete = (row) => {
    if (!window.confirm(t('stores.deleteConfirm', { name: row.name }))) return;
    deleteMutation.mutate(row.id);
  };

  const useAsWorkspace = (row) => {
    workspace.setPickedStoreId(String(row.id));
    toast.success(t('rst.admin.storeSelected', { name: row.name }));
  };

  return {
    t,
    workspace,
    search,
    setSearch,
    rows,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    modal,
    setModal,
    openCreate,
    openEdit,
    submit,
    tryDelete,
    toggleMutation,
    saveMutation,
    restaurantTypeOptions,
    useAsWorkspace,
  };
}
