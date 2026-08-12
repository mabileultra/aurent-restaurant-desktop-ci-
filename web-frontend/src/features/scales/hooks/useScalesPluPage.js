import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { scalesApi } from '../../../api/scales.api';
import { TABLE_PAGE_SIZE_OPTIONS } from '../../../components/shared/TablePagination';

const DEFAULT_PAGE_SIZE = TABLE_PAGE_SIZE_OPTIONS[1] || 14;

export function useScalesPluPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [draftPlu, setDraftPlu] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await scalesApi.listWeightProducts();
      setItems(Array.isArray(data) ? data : []);
      setDraftPlu({});
      setPage(0);
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

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

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
    items: pageItems,
    draftPlu,
    loading,
    savingId,
    onDraftChange,
    onSave,
    reload: load,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
  };
}
