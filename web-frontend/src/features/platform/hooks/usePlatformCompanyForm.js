import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { companyApi } from '../../../api/company.api';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import { emptyForm, toggleFormBusinessType } from '../utils/companyFormUtils';

export function usePlatformCompanyForm({ t, constructorTypes = [], setMenuId }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

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
        businessTypeIds = [],
        defaultBusinessTypeId,
      } = form;
      if (!name.trim()) throw new Error(t('platform.nameRequired'));
      const defaultType = constructorTypes.find((bt) => bt.id === defaultBusinessTypeId);
      const payload = {
        name: name.trim(),
        legalName: legalName.trim() || null,
        tin: tin.trim() || null,
        address: address.trim() || null,
        regionCode: regionCode || null,
        districtCode: districtCode || null,
        phone: phone.trim() || null,
        active,
        businessType: defaultType?.code ?? businessType,
      };

      let companyId = editing?.id;
      if (editing?.id) {
        await companyApi.update(editing.id, payload);
      } else {
        const res = await companyApi.create(payload);
        companyId = res.data?.id;
      }

      if (companyId && businessTypeIds.length > 0) {
        try {
          await companyBusinessTypeApi.assign(companyId, {
            typeIds: businessTypeIds,
            defaultTypeId: defaultBusinessTypeId ?? businessTypeIds[0],
          });
        } catch {
          // Non-blocking fallback
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
      qc.invalidateQueries({ queryKey: ['platform-stores-total-count'] });
      toast.success(t('platform.companyDeleted'));
      setMenuId?.(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

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
    setMenuId?.(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBusinessType = (typeId) => {
    setForm((prev) => toggleFormBusinessType(prev, typeId, constructorTypes));
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
    modalOpen,
    editing,
    form,
    saveMutation,
    openCreate,
    openEdit,
    closeModal,
    updateField,
    toggleBusinessType,
    setDefaultBusinessType,
    tryDelete,
  };
}
