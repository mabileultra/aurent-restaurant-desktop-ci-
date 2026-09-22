import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { emptyInventoryLine } from '../utils/stockDocumentFormUtils';
import { useStockFlowPaths } from '../stockFlowPaths';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';
import { toastApiError } from '../../../utils/apiError';

export function useStockInventoryCreatePage({ asModal = false, onCreated, onClose } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const paths = useStockFlowPaths();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyInventoryLine()]);
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (workspace.storeId != null) {
      setStoreId(String(workspace.storeId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [onlyStore, workspace.storeId]);

  const effectiveStoreId = resolveStoreId(storeId);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createInventory(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.inventoryCreated', { no: res.data.inventoryNumber }));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['stock-inventories-list'] });
      qc.invalidateQueries({ queryKey: ['stock-inventories-report'] });
      if (asModal) {
        onCreated?.(res.data);
        onClose?.();
        return;
      }
      navigate(paths.inventoriesReport);
    },
    onError: (e) => toastApiError(e, t('stockReports.inventoryFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyInventoryLine()]);

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    const payload = {
      storeId: sid,
      notes: notes.trim() || undefined,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({
          productId: l.productId,
          countedQuantity: Number(l.countedQuantity),
        })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.inventoryNeedLines'));
      return;
    }
    mutation.mutate(payload);
  };

  return {
    t,
    storeId,
    setStoreId,
    notes,
    setNotes,
    lines,
    stores,
    needsStorePick,
    effectiveStoreId,
    isPending: mutation.isPending,
    updateLine,
    addLine,
    removeLine,
    submit,
  };
}
