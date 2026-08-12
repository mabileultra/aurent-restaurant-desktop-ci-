import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { scalesApi } from '../../../api/scales.api';

export function useScalesPluPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [draftPlu, setDraftPlu] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await scalesApi.listWeightProducts();
      setItems(Array.isArray(data) ? data : []);
      setDraftPlu({});
    } catch (e) {
      toast.error(e.response?.data?.message || t('scales.loadFailed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const onDraftChange = useCallback((id, value) => {
    setDraftPlu((prev) => ({ ...prev, [id]: value }));
  }, []);

  const onSave = useCallback(
    async (productId, plu) => {
      setSavingId(productId);
      try {
        await scalesApi.assignPlu(productId, plu);
        toast.success(t('scales.pluSaved'));
        await load();
      } catch (e) {
        toast.error(e.response?.data?.message || t('scales.pluSaveFailed'));
      } finally {
        setSavingId(null);
      }
    },
    [load, t]
  );

  return {
    t,
    items,
    draftPlu,
    loading,
    savingId,
    onDraftChange,
    onSave,
    reload: load,
  };
}
