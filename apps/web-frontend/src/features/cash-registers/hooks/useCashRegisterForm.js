import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cashRegisterApi, storeApi } from '../../../services/api';

const emptyDefaults = {
  storeId: '',
  registerNumber: '',
  equipmentModel: '',
  equipmentSerial: '',
  fiscalCardId: '',
  deviceId: '',
  workstationName: '',
};

function mapRegisterToForm(register) {
  if (!register) return { ...emptyDefaults };
  return {
    storeId: register.storeId != null ? String(register.storeId) : '',
    registerNumber: register.registerNumber != null ? String(register.registerNumber) : '',
    equipmentModel: register.equipmentModel ?? '',
    equipmentSerial: register.equipmentSerial ?? '',
    fiscalCardId: register.fiscalCardId ?? '',
    deviceId: register.deviceId ?? '',
    workstationName: register.workstationName ?? '',
  };
}

function buildPayload(values) {
  const storeId = Number(values.storeId);
  const registerNumberRaw = String(values.registerNumber ?? '').trim();
  return {
    storeId,
    registerNumber: registerNumberRaw ? Number(registerNumberRaw) : undefined,
    equipmentModel: values.equipmentModel?.trim() || undefined,
    equipmentSerial: values.equipmentSerial?.trim() || undefined,
    fiscalCardId: values.fiscalCardId?.trim() || undefined,
    deviceId: values.deviceId?.trim() || undefined,
    workstationName: values.workstationName?.trim() || undefined,
  };
}

export function useCashRegisterForm({ open, registerId, onSaved, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEdit = registerId != null;

  const schema = useMemo(
    () =>
      z.object({
        storeId: z.string().trim().min(1, t('cashRegisters.formStoreRequired')),
        registerNumber: z.string().optional(),
        equipmentModel: z.string().optional(),
        equipmentSerial: z.string().optional(),
        fiscalCardId: z.string().optional(),
        deviceId: z.string().optional(),
        workstationName: z.string().optional(),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  const { data: stores = [], isPending: storesLoading } = useQuery({
    queryKey: ['cash-register-form-stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data ?? []),
    enabled: open,
  });

  const { data: existing, isPending: registerLoading } = useQuery({
    queryKey: ['cash-register-detail', registerId],
    queryFn: () => cashRegisterApi.getById(registerId).then((r) => r.data),
    enabled: open && isEdit,
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (existing) reset(mapRegisterToForm(existing));
      return;
    }
    reset({ ...emptyDefaults });
  }, [open, isEdit, existing, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? cashRegisterApi.update(registerId, payload).then((r) => r.data)
        : cashRegisterApi.create(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-config-form-options'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers-pick'] });
      if (registerId) {
        queryClient.invalidateQueries({ queryKey: ['cash-register-detail', registerId] });
      }
      toast.success(isEdit ? t('cashRegisters.formUpdated') : t('cashRegisters.formCreated'));
      onSaved?.();
      onClose?.();
    },
    onError: (e) =>
      toast.error(e?.response?.data?.message ?? t('cashRegisters.formSaveFailed')),
  });

  const onSubmit = handleSubmit((values) => saveMutation.mutate(buildPayload(values)));

  return {
    t,
    isEdit,
    register,
    errors,
    onSubmit,
    stores,
    loading: storesLoading || (isEdit && registerLoading),
    saving: saveMutation.isPending,
  };
}
