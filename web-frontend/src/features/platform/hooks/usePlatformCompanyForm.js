import { useEffect, useState } from 'react';
import { emptyForm, toggleFormBusinessType, resolveAssignedBusinessTypes } from '../utils/companyFormUtils';
import {
  readStoredCompanyDraft,
  saveStoredCompanyDraft,
  removeStoredCompanyDraft,
} from '../utils/companyFormDraftUtils';
import { useCompanyFormMutations } from './useCompanyFormMutations';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';

export function usePlatformCompanyForm({ t, constructorTypes = [], setMenuId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [companyToToggleActive, setCompanyToToggleActive] = useState(null);

  useEffect(() => {
    if (!modalOpen || editing) return undefined;
    const timer = setTimeout(() => saveStoredCompanyDraft(form), 400);
    return () => clearTimeout(timer);
  }, [form, modalOpen, editing]);

  const { saveMutation, deleteMutation, toggleActiveMutation } = useCompanyFormMutations({
    t,
    form,
    editing,
    constructorTypes,
    onSaveSuccess: () => {
      setIsDraftRestored(false);
      setModalOpen(false);
      setEditing(null);
    },
    onDeleteSuccess: () => {
      setCompanyToDelete(null);
    },
  });

  const handleClearDraft = () => {
    removeStoredCompanyDraft();
    setIsDraftRestored(false);
    const universal = constructorTypes.find((bt) => bt.code === 'UNIVERSAL');
    setForm({
      ...emptyForm(),
      businessTypeIds: universal ? [universal.id] : [],
      defaultBusinessTypeId: universal?.id ?? null,
    });
  };

  const openCreate = () => {
    setEditing(null);
    const draft = readStoredCompanyDraft();
    const universal = constructorTypes.find((bt) => bt.code === 'UNIVERSAL');
    const base = {
      ...emptyForm(),
      businessTypeIds: universal ? [universal.id] : [],
      defaultBusinessTypeId: universal?.id ?? null,
    };
    if (draft) {
      setForm({ ...base, ...draft });
      setIsDraftRestored(true);
    } else {
      setForm(base);
      setIsDraftRestored(false);
    }
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    setEditing(row);
    let assignedData = null;
    try {
      const res = await companyBusinessTypeApi.getForCompany(row.id);
      assignedData = res?.data;
    } catch {}

    const { businessTypeIds, defaultBusinessTypeId } = resolveAssignedBusinessTypes(
      assignedData,
      row.businessType,
      constructorTypes
    );

    setForm({
      name: row.name ?? '',
      legalName: row.legalName ?? '',
      tin: row.tin ?? '',
      address: row.address ?? '',
      regionCode: row.regionCode ?? '',
      districtCode: row.districtCode ?? '',
      phone: row.phone ?? '',
      active: row.active ?? true,
      businessType: row.businessType ?? 'UNIVERSAL',
      businessTypeIds,
      defaultBusinessTypeId: defaultBusinessTypeId ?? businessTypeIds[0] ?? null,
    });
    setModalOpen(true);
    setMenuId?.(null);
  };

  return {
    modalOpen,
    editing,
    form,
    saveMutation,
    openCreate,
    openEdit,
    closeModal: () => { setModalOpen(false); setEditing(null); },
    updateField: (field, value) => setForm((prev) => ({ ...prev, [field]: value })),
    toggleBusinessType: (typeId) => setForm((prev) => toggleFormBusinessType(prev, typeId, constructorTypes)),
    setDefaultBusinessType: (typeId) => setForm((prev) => {
      const def = constructorTypes.find((bt) => bt.id === typeId);
      return { ...prev, defaultBusinessTypeId: typeId, businessType: def?.code ?? prev.businessType };
    }),
    companyToDelete,
    setCompanyToDelete,
    handleConfirmDelete: (comp) => deleteMutation.mutate(comp.id),
    isDeleting: deleteMutation.isPending,
    tryDelete: (row) => { setCompanyToDelete(row); setMenuId?.(null); },
    companyToToggleActive,
    setCompanyToToggleActive,
    tryToggleActive: (comp) => { setCompanyToToggleActive(comp); setMenuId?.(null); },
    handleConfirmToggleActive: (comp) => {
      toggleActiveMutation.mutate(comp);
      setCompanyToToggleActive(null);
    },
    toggleActive: (comp) => toggleActiveMutation.mutate(comp),
    isTogglingActive: toggleActiveMutation.isPending,
    clearDraft: handleClearDraft,
    isDraftRestored,
    handleClearDraft,
  };
}
