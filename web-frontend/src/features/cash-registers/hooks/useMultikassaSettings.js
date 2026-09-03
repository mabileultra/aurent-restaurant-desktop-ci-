import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../api/multikassa.api';
import {
  MULTIKASSA_BASE_URL_PRESETS,
  MULTIKASSA_DEFAULT_BASE_URL,
  getContragents,
  getFiscalDrives,
  selectFiscalDrive,
} from '../../../services/multikassa';

const EMPTY_FORM = {
  enabled: false,
  baseUrl: MULTIKASSA_DEFAULT_BASE_URL,
  terminalId: '',
  moduleNumber: '',
  selectedDriveId: '',
  cashierNameOverride: '',
  requireBeforeSale: true,
};

function normalizeDrivesList(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.Result)
        ? raw.Result
        : Array.isArray(raw?.drives)
          ? raw.drives
          : [];
  return list
    .map((item, index) => {
      if (item == null) return null;
      if (typeof item === 'string' || typeof item === 'number') {
        return { id: String(item), label: String(item) };
      }
      const id =
        item.id ??
        item.Id ??
        item.driveId ??
        item.DriveId ??
        item.module_gnk_id ??
        item.ModuleNumber ??
        item.number ??
        item.Number ??
        null;
      if (id == null) return null;
      const name =
        item.name ??
        item.Name ??
        item.title ??
        item.Title ??
        item.terminalId ??
        item.TerminalId ??
        '';
      return {
        id: String(id),
        label: name ? `${id} — ${name}` : String(id),
        terminalId: item.terminalId || item.TerminalId || item.receipt_gnk_terminalid || '',
        moduleNumber: item.moduleNumber || item.ModuleNumber || item.module_gnk_id || '',
      };
    })
    .filter(Boolean)
    .map((d, index) => ({ ...d, key: `${d.id}-${index}` }));
}

export function useMultikassaSettings({ cashRegisterId, open, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [testMessage, setTestMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [selectingDrive, setSelectingDrive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['multikassa-admin', cashRegisterId],
    queryFn: () => multikassaApi.getAdminSettings(cashRegisterId).then((r) => r.data),
    enabled: open && Boolean(cashRegisterId),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      enabled: Boolean(data.enabled),
      baseUrl: data.baseUrl || MULTIKASSA_DEFAULT_BASE_URL,
      terminalId: data.terminalId || '',
      moduleNumber: data.moduleNumber || '',
      selectedDriveId: data.selectedDriveId || '',
      cashierNameOverride: data.cashierNameOverride || '',
      requireBeforeSale: data.requireBeforeSale !== false,
    });
    setTestMessage('');
  }, [data]);

  const loadDrives = async (baseUrl = form.baseUrl) => {
    const url = String(baseUrl || '').trim();
    if (!url) return [];
    setLoadingDrives(true);
    try {
      const raw = await getFiscalDrives(url);
      const next = normalizeDrivesList(raw);
      setDrives(next);
      return next;
    } catch (e) {
      setDrives([]);
      throw e;
    } finally {
      setLoadingDrives(false);
    }
  };

  useEffect(() => {
    if (!open || !form.baseUrl) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const next = await getFiscalDrives(form.baseUrl.trim());
        if (!cancelled) setDrives(normalizeDrivesList(next));
      } catch {
        if (!cancelled) setDrives([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, form.baseUrl]);

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

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const applyPreset = (key) => {
    const url = MULTIKASSA_BASE_URL_PRESETS[key] || data?.[key] || MULTIKASSA_DEFAULT_BASE_URL;
    updateField('baseUrl', url);
  };

  const submit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      enabled: form.enabled,
      baseUrl: form.baseUrl.trim(),
      terminalId: form.terminalId.trim() || null,
      moduleNumber: form.moduleNumber.trim() || null,
      selectedDriveId: form.selectedDriveId.trim() || null,
      cashierNameOverride: form.cashierNameOverride.trim() || null,
      requireBeforeSale: form.requireBeforeSale,
    });
  };

  const onSelectDrive = async (driveId) => {
    updateField('selectedDriveId', driveId);
    const drive = drives.find((d) => d.id === driveId);
    if (drive?.terminalId) updateField('terminalId', drive.terminalId);
    if (drive?.moduleNumber) updateField('moduleNumber', drive.moduleNumber);
    if (!driveId || !form.baseUrl.trim()) return;
    setSelectingDrive(true);
    try {
      await selectFiscalDrive(form.baseUrl.trim(), {
        id: driveId,
        driveId,
        module_gnk_id: driveId,
      });
      toast.success(t('cashRegisters.multikassa.driveSelected'));
    } catch (e) {
      toast.error(e?.message || t('cashRegisters.multikassa.driveSelectFailed'));
    } finally {
      setSelectingDrive(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestMessage('');
    try {
      const contragents = await getContragents(form.baseUrl.trim());
      let drivesNote = '';
      try {
        const next = await loadDrives(form.baseUrl.trim());
        drivesNote = ` · drives: ${next.length}`;
      } catch {
        drivesNote = '';
      }
      setTestMessage(t('cashRegisters.multikassa.testOk', { extra: drivesNote }));
      toast.success(t('cashRegisters.multikassa.testOkToast'));
      return contragents;
    } catch (e) {
      const msg = e?.message || t('cashRegisters.multikassa.testFailed');
      setTestMessage(msg);
      toast.error(msg);
      return null;
    } finally {
      setTesting(false);
    }
  };

  return {
    t,
    form,
    updateField,
    applyPreset,
    submit,
    testConnection,
    onSelectDrive,
    loadDrives,
    drives,
    loadingDrives,
    selectingDrive,
    isLoading,
    saving: saveMutation.isPending,
    testing,
    testMessage,
    presets: {
      local8080: data?.suggestedLocalUrl8080 || MULTIKASSA_BASE_URL_PRESETS.local8080,
      local12346: data?.suggestedLocalUrl12346 || MULTIKASSA_BASE_URL_PRESETS.local12346,
      cloudV3: data?.suggestedCloudV3 || MULTIKASSA_BASE_URL_PRESETS.cloudV3,
      cloudV4: data?.suggestedCloudV4 || MULTIKASSA_BASE_URL_PRESETS.cloudV4,
    },
  };
}
