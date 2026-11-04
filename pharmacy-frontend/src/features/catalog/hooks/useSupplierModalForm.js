import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../../api';
import { formatUzPhone, isCompleteUzPhone } from '../../../utils/phoneUz';
import {
  digitsAccount,
  formatSupplierAccount,
  isCompleteSupplierAccount,
} from '../../../utils/supplierAccountUz';

function emptyForm() {
  return {
    name: '',
    taxId: '',
    accountNumber: '',
    phone: '+998 ',
  };
}

function formFromSupplier(supplier) {
  return {
    name: supplier?.name ?? '',
    taxId: supplier?.taxId ?? '',
    accountNumber: supplier?.accountNumber
      ? formatSupplierAccount(supplier.accountNumber)
      : '',
    phone: supplier?.phone ? formatUzPhone(supplier.phone) : '+998 ',
  };
}

export function useSupplierModalForm({ open, supplier, onClose, onCreated }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = Boolean(supplier?.id);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(isEdit ? formFromSupplier(supplier) : emptyForm());
  }, [open, isEdit, supplier]);

  const mutation = useMutation({
    mutationFn: (body) =>
      isEdit ? supplierApi.update(supplier.id, body) : supplierApi.create(body),
    onSuccess: (res) => {
      toast.success(isEdit ? t('suppliersModule.updatedOk') : t('suppliersModule.createdOk'));
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers-all'] });
      if (!isEdit) onCreated?.(res?.data ?? res);
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message
          ?? (isEdit ? t('suppliersModule.updatedFail') : t('suppliersModule.createdFail'))
      );
    },
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.taxId.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    if (!isCompleteSupplierAccount(form.accountNumber)) {
      toast.error(t('suppliersModule.accountInvalid'));
      return;
    }
    if (!isCompleteUzPhone(form.phone)) {
      toast.error(t('suppliersModule.phoneRequired'));
      return;
    }
    mutation.mutate({
      name: form.name.trim(),
      taxId: form.taxId.trim(),
      accountNumber: digitsAccount(form.accountNumber),
      phone: formatUzPhone(form.phone).trim(),
    });
  };

  return {
    isEdit,
    form,
    setField,
    submit,
    pending: mutation.isPending,
  };
}
