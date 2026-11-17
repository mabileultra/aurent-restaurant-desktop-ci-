import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../api/multikassa.api';
import {
  MULTIKASSA_BASE_URL_PRESETS,
  MULTIKASSA_DEFAULT_BASE_URL,
  getFiscalDrivesWithFallback,
  getPrintersWithFallback,
  normalizeGnkTerminalId,
  parseMkFiscalPrinters,
} from '../../../services/multikassa';
import { EMPTY_FORM, normalizeDrivesList } from '../utils/multikassaDriveHelpers';
import { useMultikassaHardwareActions } from './useMultikassaHardwareActions';

export function useMultikassaSettings({ cashRegisterId, open, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [drives, setDrives] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['multikassa-admin', cashRegisterId],
    queryFn: () => multikassaApi.getAdminSettings(cashRegisterId).then((r) => r.data),
    enabled: open && Boolean(cashRegisterId),
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const hw = useMultikassaHardwareActions({
    form,
    setForm,
    drives,
    setDrives,
    updateField,
    t,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      enabled: Boolean(data.enabled),
      baseUrl: data.baseUrl || MULTIKASSA_DEFAULT_BASE_URL,
      terminalId: normalizeGnkTerminalId(data.terminalId),
      moduleNumber: normalizeGnkTerminalId(data.moduleNumber) || normalizeGnkTerminalId(data.terminalId),
      selectedDriveId: data.selectedDriveId || '',
      cashierNameOverride: data.cashierNameOverride || '',
      requireBeforeSale: Boolean(data.requireBeforeSale),
      printFiscalQr: data.printFiscalQr !== false,
    });
    hw.setTestMessage('');
    hw.setPrintersNote('');
    hw.setMkPrinterReady(false);
  }, [data]);

  useEffect(() => {
    if (!open || !form.baseUrl) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { data: raw } = await getFiscalDrivesWithFallback(form.baseUrl.trim());
        if (!cancelled) setDrives(normalizeDrivesList(raw));
      } catch {
        if (!cancelled) setDrives([]);
      }
      try {
        const { data: raw } = await getPrintersWithFallback(form.baseUrl.trim());
        if (cancelled) return;
        const parsed = parseMkFiscalPrinters(raw);
        hw.setMkPrinterReady(parsed.silentSelected);
        if (!parsed.labels.length) {
          hw.setPrintersNote(t('cashRegisters.multikassa.printersEmpty'));
        } else {
          hw.setPrintersNote(
            t(
              parsed.silentSelected
                ? 'cashRegisters.multikassa.printersSilent'
                : 'cashRegisters.multikassa.printersFound',
              {
                name: parsed.selected || '—',
                list: parsed.labels.join(', '),
              },
            ),
          );
        }
      } catch {
        if (!cancelled) {
          hw.setMkPrinterReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, form.baseUrl, t]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      multikassaApi.saveAdminSettings(cashRegisterId, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multikassa-admin', cashRegisterId] });
      toast.success(t('cashRegisters.multikassa.saved'));
      onSaved?.();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message ?? t('cashRegisters.multikassa.saveFailed')),
  });

  const applyPreset = (key) => {
    const url = MULTIKASSA_BASE_URL_PRESETS[key] || data?.[key] || MULTIKASSA_DEFAULT_BASE_URL;
    updateField('baseUrl', url);
  };

  const submit = (e) => {
    e.preventDefault();
    const terminalId = normalizeGnkTerminalId(form.terminalId) || null;
    const moduleNumber = normalizeGnkTerminalId(form.moduleNumber) || terminalId;
    saveMutation.mutate({
      enabled: form.enabled,
      baseUrl: form.baseUrl.trim(),
      terminalId,
      moduleNumber,
      selectedDriveId: form.selectedDriveId.trim() || null,
      cashierNameOverride: form.cashierNameOverride.trim() || null,
      requireBeforeSale: form.requireBeforeSale,
      printFiscalQr: form.printFiscalQr,
    });
  };

  return {
    t,
    form,
    updateField,
    applyPreset,
    submit,
    testConnection: hw.testConnection,
    onSelectDrive: hw.onSelectDrive,
    applyModuleSerialAsDrive: hw.applyModuleSerialAsDrive,
    loadDrives: hw.loadDrives,
    checkMkPrinters: hw.checkMkPrinters,
    drives,
    loadingDrives: hw.loadingDrives,
    loadingPrinters: hw.loadingPrinters,
    printersNote: hw.printersNote,
    mkPrinterReady: hw.mkPrinterReady,
    selectingDrive: hw.selectingDrive,
    isLoading,
    saving: saveMutation.isPending,
    testing: hw.testing,
    testMessage: hw.testMessage,
    presets: {
      local8080: data?.suggestedLocalUrl8080 || MULTIKASSA_BASE_URL_PRESETS.local8080,
      local12346: data?.suggestedLocalUrl12346 || MULTIKASSA_BASE_URL_PRESETS.local12346,
      cloudV3: data?.suggestedCloudV3 || MULTIKASSA_BASE_URL_PRESETS.cloudV3,
      cloudV4: data?.suggestedCloudV4 || MULTIKASSA_BASE_URL_PRESETS.cloudV4,
    },
  };
}
