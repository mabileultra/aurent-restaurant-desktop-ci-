import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { multikassaApi } from '../../../api/multikassa.api';
import {
  MULTIKASSA_BASE_URL_PRESETS,
  MULTIKASSA_DEFAULT_BASE_URL,
  getContragents,
  getFiscalDrivesWithFallback,
  ensureMkFiscalPrinter,
  getPrintersWithFallback,
  normalizeGnkTerminalId,
  parseMkFiscalPrinters,
  selectFiscalDrive,
} from '../../../services/multikassa';

const EMPTY_FORM = {
  enabled: false,
  baseUrl: MULTIKASSA_DEFAULT_BASE_URL,
  terminalId: '',
  moduleNumber: '',
  selectedDriveId: '',
  cashierNameOverride: '',
  requireBeforeSale: false,
  printFiscalQr: true,
};

function collectDriveArrays(raw, depth = 0) {
  if (raw == null || depth > 4) return [];
  if (Array.isArray(raw)) return [raw];
  if (typeof raw !== 'object') return [];
  // Точный формат MK Fiscal 1.2.x: { data: { selected, drives: [...] } }
  if (Array.isArray(raw?.data?.drives)) return [raw.data.drives];
  if (Array.isArray(raw?.drives)) return [raw.drives];
  const keys = [
    'data',
    'Data',
    'Result',
    'result',
    'drives',
    'Drives',
    'fiscal_drives',
    'fiscalDrives',
    'items',
    'Items',
    'modules',
    'Modules',
    'list',
    'List',
  ];
  const found = [];
  for (const key of keys) {
    if (Array.isArray(raw[key])) found.push(raw[key]);
  }
  for (const value of Object.values(raw)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      found.push(...collectDriveArrays(value, depth + 1));
    }
  }
  return found;
}

function pickDriveTerminal(item) {
  return (
    item.terminalID ||
    item.terminalId ||
    item.TerminalId ||
    item.TerminalID ||
    item.receipt_gnk_terminalid ||
    item.module_gnk_terminalid ||
    item.module_gnk_id ||
    ''
  );
}

function normalizeDrivesList(raw) {
  const candidates = collectDriveArrays(raw);
  const list = candidates.find((arr) => arr.length > 0) || (Array.isArray(raw) ? raw : []);
  return list
    .map((item, index) => {
      if (item == null) return null;
      if (typeof item === 'string' || typeof item === 'number') {
        return { id: String(item), label: String(item) };
      }
      const terminal = String(pickDriveTerminal(item) || '').trim();
      const factory =
        item.factoryId ??
        item.FactoryID ??
        item.factory_id ??
        item.FactoryId ??
        null;
      const id =
        factory ??
        item.id ??
        item.Id ??
        item.driveId ??
        item.DriveId ??
        item.module_gnk_id ??
        item.ModuleGnkId ??
        (terminal || null) ??
        item.serial ??
        item.Serial ??
        item.serialNumber ??
        item.SerialNumber ??
        item.ModuleNumber ??
        item.moduleNumber ??
        item.number ??
        item.Number ??
        null;
      if (id == null || String(id).trim() === '') return null;
      const idStr = String(id).trim();
      const name =
        item.name ??
        item.Name ??
        item.title ??
        item.Title ??
        terminal ??
        '';
      return {
        id: idStr,
        label: terminal && terminal !== idStr ? `${terminal} (${idStr})` : name ? `${idStr} — ${name}` : idStr,
        terminalId: terminal || idStr,
        // В чеке GNK / module_gnk_id — серийник YZ…, не factoryId
        moduleNumber: terminal || idStr,
        factoryId: factory != null ? String(factory).trim() : idStr,
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
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [printersNote, setPrintersNote] = useState('');
  const [mkPrinterReady, setMkPrinterReady] = useState(false);

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
      terminalId: normalizeGnkTerminalId(data.terminalId),
      moduleNumber: normalizeGnkTerminalId(data.moduleNumber) || normalizeGnkTerminalId(data.terminalId),
      selectedDriveId: data.selectedDriveId || '',
      cashierNameOverride: data.cashierNameOverride || '',
      requireBeforeSale: Boolean(data.requireBeforeSale),
      printFiscalQr: data.printFiscalQr !== false,
    });
    setTestMessage('');
    setPrintersNote('');
    setMkPrinterReady(false);
  }, [data]);

  const loadDrives = async (baseUrl = form.baseUrl, { notifyEmpty = false } = {}) => {
    const url = String(baseUrl || '').trim();
    if (!url) return [];
    setLoadingDrives(true);
    try {
      const { data: raw } = await getFiscalDrivesWithFallback(url);
      const next = normalizeDrivesList(raw);
      setDrives(next);
      if (notifyEmpty && next.length === 0) {
        toast(t('cashRegisters.multikassa.drivesEmptyHint'));
      }
      // Один ФМ в ответе — подставить Terminal ID / module автоматически
      if (next.length === 1) {
        const only = next[0];
        const terminal = normalizeGnkTerminalId(only.terminalId);
        setForm((prev) => ({
          ...prev,
          selectedDriveId: prev.selectedDriveId || only.id,
          terminalId: prev.terminalId || terminal,
          moduleNumber: prev.moduleNumber || terminal,
        }));
      }
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
        const { data: raw } = await getFiscalDrivesWithFallback(form.baseUrl.trim());
        if (!cancelled) setDrives(normalizeDrivesList(raw));
      } catch {
        if (!cancelled) setDrives([]);
      }
      try {
        const { data: raw } = await getPrintersWithFallback(form.baseUrl.trim());
        if (cancelled) return;
        const parsed = parseMkFiscalPrinters(raw);
        setMkPrinterReady(parsed.selectedValid);
        if (!parsed.labels.length) {
          setPrintersNote(t('cashRegisters.multikassa.printersEmpty'));
        } else {
          setPrintersNote(
            t('cashRegisters.multikassa.printersFound', {
              name: parsed.selectedValid ? parsed.selected : '—',
              list: parsed.labels.join(', '),
            }),
          );
        }
      } catch {
        if (!cancelled) {
          setMkPrinterReady(false);
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

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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

  const onSelectDrive = async (driveId) => {
    updateField('selectedDriveId', driveId);
    const drive = drives.find((d) => d.id === driveId);
    const terminal = normalizeGnkTerminalId(drive?.terminalId || '');
    if (terminal) {
      updateField('terminalId', terminal);
      updateField('moduleNumber', terminal);
    }
    if (!driveId || !form.baseUrl.trim()) return;
    setSelectingDrive(true);
    try {
      await selectFiscalDrive(form.baseUrl.trim(), {
        factoryId: drive?.factoryId || driveId,
        FactoryID: drive?.factoryId || driveId,
        terminalID: terminal || driveId,
        terminalId: terminal || driveId,
        id: drive?.factoryId || driveId,
        driveId: drive?.factoryId || driveId,
        module_gnk_id: terminal || driveId,
      });
      toast.success(t('cashRegisters.multikassa.driveSelected'));
    } catch (e) {
      toast.error(e?.message || t('cashRegisters.multikassa.driveSelectFailed'));
    } finally {
      setSelectingDrive(false);
    }
  };

  /** Список ФМ пуст — подставить серийник модуля (YZ…) как drive id вручную. */
  const applyModuleSerialAsDrive = () => {
    const serial = normalizeGnkTerminalId(form.moduleNumber || form.terminalId);
    if (!serial) {
      toast.error(t('cashRegisters.multikassa.moduleSerialRequired'));
      return;
    }
    updateField('selectedDriveId', serial);
    updateField('terminalId', serial);
    updateField('moduleNumber', serial);
    toast.success(t('cashRegisters.multikassa.driveFilledFromModule', { serial }));
  };

  const checkMkPrinters = async () => {
    const url = String(form.baseUrl || '').trim();
    if (!url) return;
    setLoadingPrinters(true);
    setPrintersNote('');
    try {
      const result = await ensureMkFiscalPrinter(url);
      setMkPrinterReady(result.selectedValid);
      if (!result.labels.length) {
        setPrintersNote(t('cashRegisters.multikassa.printersEmpty'));
        toast.error(t('cashRegisters.multikassa.printersEmpty'));
      } else {
        const note = t(
          result.changed
            ? 'cashRegisters.multikassa.printersAutoSelected'
            : 'cashRegisters.multikassa.printersFound',
          {
            name: result.selectedValid ? result.selected : '—',
            list: result.labels.join(', '),
          },
        );
        setPrintersNote(note);
        toast.success(note);
      }
    } catch (e) {
      const msg = e?.message || t('cashRegisters.multikassa.printersLoadFailed');
      setMkPrinterReady(false);
      setPrintersNote(msg);
      toast.error(msg);
    } finally {
      setLoadingPrinters(false);
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
    applyModuleSerialAsDrive,
    loadDrives,
    checkMkPrinters,
    drives,
    loadingDrives,
    loadingPrinters,
    printersNote,
    mkPrinterReady,
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
