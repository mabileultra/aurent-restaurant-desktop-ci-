import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cashRegisterApi, storeApi } from '../../../services/api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import {
  findFiscalCardConflict,
  formatFiscalCardConflictMessage,
  isConflictApiError,
} from '../utils/fiscalCardConflict';

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
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  const watchedFiscalCard = watch('fiscalCardId');
  const trimmedFiscalCard = String(watchedFiscalCard ?? '').trim();
  const debouncedFiscalCard = useDebouncedValue(trimmedFiscalCard, 250);
  const [submitConflictRow, setSubmitConflictRow] = useState(null);
  const [serverFiscalError, setServerFiscalError] = useState('');
  const [checkingConflict, setCheckingConflict] = useState(false);

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

  const { data: fiscalMatches = [], isFetching: fiscalFetching } = useQuery({
    queryKey: ['cash-register-fiscal-check', debouncedFiscalCard],
    queryFn: () =>
      cashRegisterApi
        .getAll({ fiscalCardId: debouncedFiscalCard, page: 0, size: 50 })
        .then((r) => r.data?.content ?? []),
    enabled: open && Boolean(debouncedFiscalCard),
  });

  const liveConflict = useMemo(
    () =>
      findFiscalCardConflict(fiscalMatches, {
        fiscalCardId: trimmedFiscalCard,
        ignoreRegisterId: registerId,
      }),
    [fiscalMatches, trimmedFiscalCard, registerId]
  );

  useEffect(() => {
    setSubmitConflictRow(null);
    setServerFiscalError('');
  }, [open, trimmedFiscalCard]);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (existing) reset(mapRegisterToForm(existing));
      return;
    }
    reset({ ...emptyDefaults });
  }, [open, isEdit, existing, reset]);

  const conflictRow = liveConflict || submitConflictRow;
  const fiscalCardError =
    serverFiscalError || (conflictRow ? formatFiscalCardConflictMessage(t, conflictRow) : '');

  const saveMutation = useMutation({
    meta: { suppressGlobalError: true },
    mutationFn: (payload) =>
      isEdit
        ? cashRegisterApi.update(registerId, payload).then((r) => r.data)
        : cashRegisterApi.create(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-config-form-options'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers-pick'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-fiscal-check'] });
      if (registerId) {
        queryClient.invalidateQueries({ queryKey: ['cash-register-detail', registerId] });
      }
      toast.success(isEdit ? t('cashRegisters.formUpdated') : t('cashRegisters.formCreated'));
      onSaved?.();
      onClose?.();
    },
    onError: (e) => {
      const msg = e?.response?.data?.message ?? t('cashRegisters.formSaveFailed');
      if (isConflictApiError(e)) {
        setServerFiscalError(msg);
      }
      toast.error(msg);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = buildPayload(values);
    if (payload.fiscalCardId) {
      if (conflictRow) {
        toast.error(formatFiscalCardConflictMessage(t, conflictRow));
        return;
      }
      setCheckingConflict(true);
      try {
        const rows = await cashRegisterApi
          .getAll({ fiscalCardId: payload.fiscalCardId, page: 0, size: 50 })
          .then((r) => r.data?.content ?? []);
        const conflict = findFiscalCardConflict(rows, {
          fiscalCardId: payload.fiscalCardId,
          ignoreRegisterId: registerId,
        });
        if (conflict) {
          setSubmitConflictRow(conflict);
          toast.error(formatFiscalCardConflictMessage(t, conflict));
          return;
        }
      } catch {
        void 0;
      } finally {
        setCheckingConflict(false);
      }
    }
    saveMutation.mutate(payload);
  });

  return {
    t,
    isEdit,
    register,
    errors,
    fiscalCardError,
    checkingFiscalCard: checkingConflict || (Boolean(trimmedFiscalCard) && fiscalFetching),
    onSubmit,
    stores,
    loading: storesLoading || (isEdit && registerLoading),
    saving: saveMutation.isPending,
  };
}
