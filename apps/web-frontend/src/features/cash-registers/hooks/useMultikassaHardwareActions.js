import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ensureMkFiscalPrinter,
  getContragents,
  getFiscalDrivesWithFallback,
  normalizeGnkTerminalId,
  selectFiscalDrive,
} from '../../../services/multikassa';
import { normalizeDrivesList } from '../utils/multikassaDriveHelpers';

export function useMultikassaHardwareActions({ form, setForm, drives, setDrives, updateField, t }) {
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [selectingDrive, setSelectingDrive] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [printersNote, setPrintersNote] = useState('');
  const [mkPrinterReady, setMkPrinterReady] = useState(false);

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
      setMkPrinterReady(Boolean(result.silent));
      if (!result.labels.length) {
        setPrintersNote(t('cashRegisters.multikassa.printersEmpty'));
        toast.error(t('cashRegisters.multikassa.printersEmpty'));
      } else {
        const note = t(
          result.silent
            ? result.changed
              ? 'cashRegisters.multikassa.printersSilentAuto'
              : 'cashRegisters.multikassa.printersSilent'
            : result.changed
              ? 'cashRegisters.multikassa.printersAutoSelected'
              : 'cashRegisters.multikassa.printersFound',
          {
            name: result.selected || '—',
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
    testing,
    testMessage,
    setTestMessage,
    loadingDrives,
    selectingDrive,
    loadingPrinters,
    printersNote,
    setPrintersNote,
    mkPrinterReady,
    setMkPrinterReady,
    loadDrives,
    onSelectDrive,
    applyModuleSerialAsDrive,
    checkMkPrinters,
    testConnection,
  };
}
