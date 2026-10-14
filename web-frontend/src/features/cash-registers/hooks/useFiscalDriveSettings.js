import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { fiscalDriveApi } from '../../../api/fiscalDrive.api';
import {
  FISCAL_DRIVE_DEFAULT_BASE_URL,
  getFiscalDriveInfo,
  listFiscalDrives,
  parseFiscalDriveFactoryIds,
  summarizeFiscalDriveInfo,
} from '../../../services/fiscal/providers/fiscalDrive';

const EMPTY_FORM = {
  baseUrl: FISCAL_DRIVE_DEFAULT_BASE_URL,
  factoryId: '',
  terminalId: '',
  ownerTin: '',
  useForFiscalization: false,
};

function formFromSettings(data) {
  return {
    baseUrl: data?.baseUrl || data?.defaultBaseUrl || FISCAL_DRIVE_DEFAULT_BASE_URL,
    factoryId: data?.factoryId || '',
    terminalId: data?.terminalId || '',
    ownerTin: data?.ownerTin || '',
    useForFiscalization: Boolean(data?.useForFiscalization),
  };
}

export function useFiscalDriveSettings({ cashRegisterId, open, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [factoryIds, setFactoryIds] = useState([]);
  const [searching, setSearching] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const queryKey = ['fiscal-drive-settings', cashRegisterId];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fiscalDriveApi.getAdminSettings(cashRegisterId).then((r) => r.data),
    enabled: Boolean(open && cashRegisterId),
  });

  useEffect(() => {
    if (!open) return;
    setForm(data ? formFromSettings(data) : EMPTY_FORM);
    setFactoryIds([]);
    setStatusMessage('');
  }, [open, data]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const checkDrive = async (factoryId = form.factoryId) => {
    const id = String(factoryId || '').trim();
    if (!id) {
      toast.error(t('cashRegisters.fiscalDrive.factoryIdRequired'));
      return;
    }
    setChecking(true);
    try {
      const info = summarizeFiscalDriveInfo(await getFiscalDriveInfo(form.baseUrl, id));
      if (info.terminalId) updateField('terminalId', info.terminalId);
      setStatusMessage(
        t('cashRegisters.fiscalDrive.driveOk', {
          terminalId: info.terminalId || '—',
          version: info.version || '—',
        }),
      );
    } catch (err) {
      setStatusMessage(err?.message || t('cashRegisters.fiscalDrive.checkFailed'));
    } finally {
      setChecking(false);
    }
  };

  const findDrives = async () => {
    setSearching(true);
    setStatusMessage('');
    try {
      const raw = await listFiscalDrives(form.baseUrl);
      const ids = parseFiscalDriveFactoryIds(raw);
      setFactoryIds(ids);
      if (ids.length === 0) {
        const msg = t('cashRegisters.fiscalDrive.noDrives');
        setStatusMessage(msg);
        toast.error(msg, { id: 'fiscal-drive-find' });
        return;
      }
      if (ids.length === 1) {
        updateField('factoryId', ids[0]);
        await checkDrive(ids[0]);
        toast.success(t('cashRegisters.fiscalDrive.foundOne', { factoryId: ids[0] }), {
          id: 'fiscal-drive-find',
        });
        return;
      }
      updateField('factoryId', ids[0]);
      setStatusMessage(t('cashRegisters.fiscalDrive.foundMany', { count: ids.length }));
      toast.success(t('cashRegisters.fiscalDrive.foundMany', { count: ids.length }), {
        id: 'fiscal-drive-find',
      });
    } catch (err) {
      const msg = err?.message || t('cashRegisters.fiscalDrive.searchFailed');
      setStatusMessage(msg);
      toast.error(msg, { id: 'fiscal-drive-find', duration: 8000 });
    } finally {
      setSearching(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => fiscalDriveApi.saveAdminSettings(cashRegisterId, payload).then((r) => r.data),
    onSuccess: (saved) => {
      qc.setQueryData(queryKey, saved);
      toast.success(t('cashRegisters.fiscalDrive.saved'));
      onSaved?.();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || t('cashRegisters.fiscalDrive.saveFailed'));
    },
  });

  const submit = (e) => {
    e?.preventDefault?.();
    saveMutation.mutate({
      baseUrl: form.baseUrl.trim(),
      factoryId: form.factoryId.trim() || null,
      terminalId: form.terminalId.trim() || null,
      ownerTin: form.ownerTin.trim() || null,
      useForFiscalization: Boolean(form.useForFiscalization),
    });
  };

  return {
    t,
    form,
    isLoading,
    factoryIds,
    searching,
    checking,
    statusMessage,
    saving: saveMutation.isPending,
    updateField,
    findDrives,
    checkDrive: () => checkDrive(),
    submit,
  };
}
