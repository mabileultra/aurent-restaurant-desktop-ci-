import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';
import { WRITE_OFF_REASONS } from '../utils/stockDocumentFormUtils';
import { toastApiError } from '../../../utils/apiError';

/** Списание одной позиции (документ WRITE_OFF). */
export function useStockWriteOffCreate({ product = null, onCreated, onClose } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState(product?.id ? String(product.id) : '');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('DEFECT');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (workspace.storeId != null) {
      setStoreId(String(workspace.storeId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [workspace.storeId, onlyStore]);

  useEffect(() => {
    if (product?.id) setProductId(String(product.id));
  }, [product?.id]);

  const effectiveStoreId = resolveStoreId(storeId);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createWriteOff(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.writeOffSuccess'));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['write-offs'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      onCreated?.(res.data);
      onClose?.();
    },
    onError: (e) => toastApiError(e, t('stockReports.writeOffFailed')),
  });

  const submit = () => {
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    if (!productId) {
      toast.error(t('stockReports.pickProduct'));
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error(t('stockReports.writeOffQtyInvalid', { defaultValue: t('stockReports.writeOffFailed') }));
      return;
    }
    mutation.mutate({
      productId,
      quantity: qty,
      reason,
      notes: notes.trim() || undefined,
      storeId: sid,
    });
  };

  return {
    t,
    storeId,
    setStoreId,
    productId,
    setProductId,
    quantity,
    setQuantity,
    reason,
    setReason,
    notes,
    setNotes,
    stores,
    needsStorePick,
    effectiveStoreId,
    reasons: WRITE_OFF_REASONS,
    isPending: mutation.isPending,
    submit,
    productName: product?.name,
  };
}
