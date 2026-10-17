import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { scalesApi } from '../../../api/scales.api';
import {
  isDesktopScaleBridge,
  scaleGetActiveAdapter,
  scaleListAdapters,
  scalePushPlu,
  scaleSetActiveAdapter,
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

export function useScalesPluSync(t) {
  const desktop = isDesktopScaleBridge();
  const [adapters, setAdapters] = useState([]);
  const [active, setActive] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastExport, setLastExport] = useState(null);

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

  useEffect(() => {
    refreshAdapters();
  }, [refreshAdapters]);

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
      if (result?.ok) {
        const devices = result.deviceCount || result.deviceTotal || 1;
        toast.success(
          t('scales.exportOkDevices', {
            count: result.pushed ?? items.length,
            devices,
            defaultValue: `Выгружено PLU: ${result.pushed ?? items.length} → весов: ${devices}`,
          })
        );
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
    lastExport,
    onSelectAdapter,
    onExportToScale,
    refreshAdapters,
  };
}
