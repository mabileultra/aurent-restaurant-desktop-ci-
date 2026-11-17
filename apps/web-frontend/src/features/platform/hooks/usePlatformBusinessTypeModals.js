import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformBusinessTypeApi } from '../../../api';
import {
  EMPTY_BUSINESS_FIELD_FORM,
  EMPTY_BUSINESS_TYPE_FORM,
  fieldToForm,
  parseOptionsText,
} from '../utils/businessTypeUtils';

export function usePlatformBusinessTypeModals({ activeTypeId, detail, setSelectedId, invalidate, t }) {
  const [typeModal, setTypeModal] = useState(null);
  const [fieldModal, setFieldModal] = useState(null);
  const [fieldForm, setFieldForm] = useState(EMPTY_BUSINESS_FIELD_FORM);

  const saveTypeMutation = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? platformBusinessTypeApi.update(payload.id, payload.body)
        : platformBusinessTypeApi.create(payload.body),
    onSuccess: (res) => {
      invalidate();
      setSelectedId(res.data.id);
      setTypeModal(null);
      toast.success(t('platform.businessTypes.saved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => platformBusinessTypeApi.delete(id),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success(t('platform.businessTypes.deleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const saveFieldMutation = useMutation({
    mutationFn: ({ typeId, fieldId, body }) =>
      fieldId
        ? platformBusinessTypeApi.updateField(typeId, fieldId, body)
        : platformBusinessTypeApi.addField(typeId, body),
    onSuccess: () => {
      invalidate();
      setFieldModal(null);
      toast.success(t('platform.businessTypes.fieldSaved'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ typeId, fieldId }) => platformBusinessTypeApi.deleteField(typeId, fieldId),
    onSuccess: () => {
      invalidate();
      toast.success(t('platform.businessTypes.fieldDeleted'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const openCreateType = () => {
    setTypeModal({ mode: 'create', form: { ...EMPTY_BUSINESS_TYPE_FORM } });
  };

  const openEditType = () => {
    if (!detail) return;
    setTypeModal({
      mode: 'edit',
      id: detail.id,
      form: {
        name: detail.name,
        description: detail.description ?? '',
        active: detail.active,
        sortOrder: detail.sortOrder,
      },
    });
  };

  const closeTypeModal = () => setTypeModal(null);

  const updateTypeForm = (patch) => {
    setTypeModal((prev) => (prev ? { ...prev, form: { ...prev.form, ...patch } } : prev));
  };

  const saveType = () => {
    if (!typeModal) return;
    saveTypeMutation.mutate({ id: typeModal.id, body: typeModal.form });
  };

  const tryDeleteType = () => {
    if (!detail) return;
    if (window.confirm(t('platform.businessTypes.deleteConfirm', { name: detail.name }))) {
      deleteTypeMutation.mutate(detail.id);
    }
  };

  const openCreateField = () => {
    setFieldForm(EMPTY_BUSINESS_FIELD_FORM);
    setFieldModal({ mode: 'create' });
  };

  const openFieldEdit = (field) => {
    setFieldForm(fieldToForm(field));
    setFieldModal({ mode: 'edit', field });
  };

  const closeFieldModal = () => setFieldModal(null);

  const updateFieldForm = (patch) => {
    setFieldForm((prev) => ({ ...prev, ...patch }));
  };

  const submitField = () => {
    const body = {
      label: fieldForm.label.trim(),
      fieldType: fieldForm.fieldType,
      required: fieldForm.required,
      enabled: fieldForm.enabled,
      filterable: fieldForm.filterable,
      sortOrder: Number(fieldForm.sortOrder) || 100,
      placeholder: fieldForm.placeholder.trim() || null,
      hint: fieldForm.hint.trim() || null,
      referenceBookId: fieldForm.referenceBookId ? Number(fieldForm.referenceBookId) : null,
      options: fieldForm.fieldType === 'LIST' && !fieldForm.referenceBookId
        ? parseOptionsText(fieldForm.optionsText)
        : [],
    };
    if (fieldModal?.mode === 'edit') {
      saveFieldMutation.mutate({ typeId: activeTypeId, fieldId: fieldModal.field.id, body });
      return;
    }
    saveFieldMutation.mutate({
      typeId: activeTypeId,
      body: { ...body, fieldKey: fieldForm.fieldKey.trim().toLowerCase() },
    });
  };

  const tryDeleteField = (field) => {
    if (window.confirm(t('platform.businessTypes.deleteFieldConfirm', { name: field.label }))) {
      deleteFieldMutation.mutate({ typeId: activeTypeId, fieldId: field.id });
    }
  };

  return {
    typeModal,
    fieldModal,
    fieldForm,
    saveTypeMutation,
    saveFieldMutation,
    openCreateType,
    openEditType,
    closeTypeModal,
    updateTypeForm,
    saveType,
    tryDeleteType,
    openCreateField,
    openFieldEdit,
    closeFieldModal,
    updateFieldForm,
    submitField,
    tryDeleteField,
  };
}
