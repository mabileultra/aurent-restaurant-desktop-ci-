import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';
import { EXPENSE_REASONS } from '../utils/stockDocumentFormUtils';
import { toastApiError } from '../../../utils/apiError';

export function useStockExpenseCreate({ onCreated, onClose } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  const [storeId, setStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [expenseReason, setExpenseReason] = useState('INTERNAL_USE');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (workspace.storeId != null) {
      setStoreId(String(workspace.storeId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [workspace.storeId, onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createExpense(body),
    onSuccess: (res) => {
      toast.success(t('rst.stock.expenseCreated', {
        no: res.data?.expenseNumber ? ` (${res.data.expenseNumber})` : '',
      }));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['stock-expenses'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      onCreated?.(res.data);
      onClose?.();
    },
    onError: (e) => toastApiError(e, t('rst.stock.expenseFailed')),
  });

  const selectProduct = (next) => {
    setProduct(next || null);
    setProductId(next?.id ? String(next.id) : '');
  };

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
    const qty = Number(String(quantity).replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error(t('stockReports.writeOffQtyInvalid', { defaultValue: t('rst.stock.expenseFailed') }));
      return;
    }
    const available = product?.stockQuantity != null ? Number(product.stockQuantity) : null;
    if (available != null && Number.isFinite(available) && qty > available) {
      toast.error(t('rst.stock.expenseInsufficient', {
        defaultValue: `Недостаточно остатка. Доступно: ${available}`,
        available,
      }));
      return;
    }
    mutation.mutate({
      storeId: sid,
      reason: expenseReason,
      recipient: recipient.trim() || undefined,
      notes: notes.trim() || undefined,
      lines: [{ productId, quantity: qty }],
    });
  };

  return {
    t,
    storeId,
    setStoreId,
    productId,
    product,
    selectProduct,
    quantity,
    setQuantity,
    expenseReason,
    setExpenseReason,
    recipient,
    setRecipient,
    notes,
    setNotes,
    stores,
    needsStorePick,
    effectiveStoreId,
    expenseReasons: EXPENSE_REASONS,
    isPending: mutation.isPending,
    submit,
  };
}
