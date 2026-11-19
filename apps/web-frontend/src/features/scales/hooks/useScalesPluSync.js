import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { scalesApi } from '../../../api/scales.api';
import {
  isDesktopScaleBridge,
  scaleGetActiveAdapter,
  scaleGetSettings,
  scaleListAdapters,
  scaleProbeDevices,
  scalePushPlu,
  scaleSetActiveAdapter,
  scaleSetSettings,
} from '../../../scales/scaleBridge';

function mapFamilyToAdapter(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    modelsHint: row.modelsHint || '',
    family: row.id !== 'weight-generic',
    readyNow: Boolean(row.readyNow),
    capabilities: {
      weight: Boolean(row.weight),
      pluPush: Boolean(row.pluPush),
      builtInPrint: Boolean(row.builtInPrint),
    },
  };
}

function formatSyncAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export function useScalesPluSync(t) {
  const desktop = isDesktopScaleBridge();
  const [adapters, setAdapters] = useState([]);
  const [active, setActive] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [probing, setProbing] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const [probeResult, setProbeResult] = useState(null);
  const [pushDevices, setPushDevices] = useState(null);
  const [password, setPassword] = useState('0030');
  const [lastSync, setLastSync] = useState(null);

  const refreshAdapters = useCallback(async () => {
    try {
      if (desktop) {
        const list = await scaleListAdapters();
        setAdapters(Array.isArray(list) ? list : []);
        const current = await scaleGetActiveAdapter();
        setActive(current);
        return;
      }
      const { data } = await scalesApi.listAdapterFamilies();
      const list = (data || []).map(mapFamilyToAdapter);
      setAdapters(list);
      setActive(list.find((a) => a.readyNow) || list[0] || null);
    } catch {
      setAdapters([]);
      setActive(null);
    }
  }, [desktop]);

  const refreshSettings = useCallback(async () => {
    if (!desktop) return;
    const s = await scaleGetSettings();
    if (!s) return;
    if (s.password) setPassword(String(s.password));
    if (s.lastPluSyncAt) {
      setLastSync({
        at: formatSyncAt(s.lastPluSyncAt),
        pushed: s.lastPluSyncPushed || 0,
        devices: s.lastPluSyncDevices || 0,
      });
    }
  }, [desktop]);

  useEffect(() => {
    refreshAdapters();
    refreshSettings();
  }, [refreshAdapters, refreshSettings]);

  const onSelectAdapter = useCallback(
    async (adapterId) => {
      if (!desktop) {
        const next = adapters.find((a) => a.id === adapterId) || null;
        setActive(next);
        toast.success(t('scales.adapterSelected'));
        return;
      }
      const next = await scaleSetActiveAdapter(adapterId);
      setActive(next);
      toast.success(t('scales.adapterSelected'));
    },
    [adapters, desktop, t]
  );

  const onPasswordSave = useCallback(async () => {
    const next = String(password || '').replace(/\D/g, '').padStart(4, '0').slice(-4);
    setPassword(next);
    const saved = await scaleSetSettings({ scalePassword: next });
    if (saved?.password) {
      toast.success(t('scales.passwordSaved'));
    } else {
      toast.error(t('scales.passwordSaveFailed'));
    }
  }, [password, t]);

  const onProbeDevices = useCallback(async () => {
    if (!desktop) {
      toast.error(t('scales.desktopRequired'));
      return;
    }
    setProbing(true);
    try {
      const result = await scaleProbeDevices();
      setProbeResult(result);
      if (result?.ok) toast.success(result.message || t('scales.probeOk'));
      else toast.error(result?.message || t('scales.probeFailed'));
    } catch (e) {
      toast.error(e?.message || t('scales.probeFailed'));
    } finally {
      setProbing(false);
    }
  }, [desktop, t]);

  const onExportToScale = useCallback(async () => {
    if (!desktop) {
      toast.error(t('scales.desktopRequired'));
      return;
    }
    setSyncing(true);
    try {
      const { data } = await scalesApi.exportPluCatalog({ onlyWithPlu: true });
      const items = (data?.items || [])
        .filter((row) => row?.plu)
        .map((row) => ({
          productId: row.productId,
          plu: row.plu,
          name: row.name,
          sku: row.sku,
          pricePerKg: row.pricePerKg,
          unitCode: row.unitCode,
        }));
      setLastExport(data);
      if (!items.length) {
        toast.error(t('scales.exportEmpty'));
        return;
      }
      const result = await scalePushPlu(items);
      setPushDevices(Array.isArray(result?.devices) ? result.devices : null);
      if (result?.ok) {
        const devices = result.deviceCount || result.deviceTotal || 1;
        toast.success(
          t('scales.exportOkDevices', {
            count: result.pushed ?? items.length,
            devices,
          })
        );
        if (result.syncedAt || result.pushed != null) {
          setLastSync({
            at: formatSyncAt(result.syncedAt || new Date().toISOString()),
            pushed: result.pushed ?? items.length,
            devices,
          });
        }
        if (result.message && result.deviceCount < result.deviceTotal) {
          toast.error(result.message);
        }
      } else {
        toast.error(result?.message || t('scales.exportStubHint'));
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t('scales.exportFailed'));
    } finally {
      setSyncing(false);
    }
  }, [desktop, t]);

  return {
    desktop,
    adapters,
    active,
    syncing,
    probing,
    lastExport,
    probeResult,
    pushDevices,
    password,
    setPassword,
    lastSync,
    onSelectAdapter,
    onExportToScale,
    onProbeDevices,
    onPasswordSave,
    refreshAdapters,
  };
}
