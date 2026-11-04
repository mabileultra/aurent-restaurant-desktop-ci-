import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi, warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';
import { emptyTransferLine } from '../utils/stockDocumentFormUtils';
import { toastApiError } from '../../../utils/apiError';

export function useStockTransferCreate({ onCreated, onClose } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyTransferLine()]);

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });
  const stores = storesQuery.data ?? [];

  useEffect(() => {
    if (workspace.storeId != null) setFromStoreId(String(workspace.storeId));
  }, [workspace.storeId]);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createTransfer(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.transferCreated', { no: res.data.transferNumber }));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['stock-transfers-list'] });
      qc.invalidateQueries({ queryKey: ['stock-transfers-report'] });
      onCreated?.(res.data);
      onClose?.();
    },
    onError: (e) => toastApiError(e, t('stockReports.transferFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyTransferLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const submit = () => {
    if (!fromStoreId || !toStoreId) {
      toast.error(t('stockReports.transferNeedStores'));
      return;
    }
    if (fromStoreId === toStoreId) {
      toast.error(t('rst.stock.transferSameStore'));
      return;
    }
    const payload = {
      fromStoreId: Number(fromStoreId),
      toStoreId: Number(toStoreId),
      notes: notes.trim() || undefined,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.transferNeedLines'));
      return;
    }
    mutation.mutate(payload);
  };

  return {
    t,
    fromStoreId,
    setFromStoreId,
    toStoreId,
    setToStoreId,
    notes,
    setNotes,
    lines,
    stores,
    isPending: mutation.isPending,
    updateLine,
    addLine,
    removeLine,
    submit,
  };
}
