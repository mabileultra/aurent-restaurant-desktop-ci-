import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';
import { emptyProductionInputLine } from '../utils/stockDocumentFormUtils';
import { toastApiError } from '../../../utils/apiError';

export function useStockProductionCreate({ onCreated, onClose } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  const [storeId, setStoreId] = useState('');
  const [outputProductId, setOutputProductId] = useState('');
  const [outputQty, setOutputQty] = useState('1');
  const [outputCost, setOutputCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [inputs, setInputs] = useState([emptyProductionInputLine()]);

  useEffect(() => {
    if (workspace.storeId != null) {
      setStoreId(String(workspace.storeId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [workspace.storeId, onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createProduction(body),
    onSuccess: (res) => {
      toast.success(t('rst.stock.productionCreated', {
        no: res.data?.productionNumber ? ` (${res.data.productionNumber})` : '',
      }));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['stock-productions'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      onCreated?.(res.data);
      onClose?.();
    },
    onError: (e) => toastApiError(e, t('rst.stock.productionFailed')),
  });

  const updateInput = (idx, patch) => {
    setInputs((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const addInput = () => setInputs((prev) => [...prev, emptyProductionInputLine()]);
  const removeInput = (idx) => setInputs((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    if (!outputProductId) {
      toast.error(t('rst.stock.productionNeedOutput'));
      return;
    }
    const qty = Number(outputQty);
    const cost = Number(outputCost);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost < 0) {
      toast.error(t('rst.stock.productionNeedOutput'));
      return;
    }
    const inputLines = inputs
      .filter((l) => l.productId)
      .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) }))
      .filter((l) => Number.isFinite(l.quantity) && l.quantity > 0);
    if (inputLines.length === 0) {
      toast.error(t('rst.stock.productionNeedInputs'));
      return;
    }
    mutation.mutate({
      storeId: sid,
      outputProductId,
      outputQuantity: qty,
      outputUnitCost: cost,
      notes: notes.trim() || undefined,
      lines: inputLines,
    });
  };

  return {
    t,
    storeId,
    setStoreId,
    outputProductId,
    setOutputProductId,
    outputQty,
    setOutputQty,
    outputCost,
    setOutputCost,
    notes,
    setNotes,
    inputs,
    stores,
    needsStorePick,
    effectiveStoreId,
    isPending: mutation.isPending,
    updateInput,
    addInput,
    removeInput,
    submit,
  };
}
