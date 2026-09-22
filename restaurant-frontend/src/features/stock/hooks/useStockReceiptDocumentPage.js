import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { categoryApi, supplierApi, warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';
import { emptyReceiptLine } from '../utils/stockDocumentFormUtils';
import { useStockFlowPaths } from '../stockFlowPaths';
import { toastApiError } from '../../../utils/apiError';

export function useStockReceiptDocumentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const paths = useStockFlowPaths();
  const qc = useQueryClient();
  const workspace = useRestaurantWorkspaceStore();

  const [supplierId, setSupplierId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [lines, setLines] = useState([emptyReceiptLine()]);
  const [createLineIdx, setCreateLineIdx] = useState(null);

  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (!isNew) return;
    if (workspace.storeId != null) {
      setStoreId(String(workspace.storeId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [isNew, workspace.storeId, onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const receiptQuery = useQuery({
    queryKey: ['stock-receipt', id],
    queryFn: () => warehouseApi.getReceipt(id).then((r) => r.data),
    enabled: !isNew && Boolean(id),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: isNew,
  });

  const supplierList = suppliersQuery.data?.content ?? [];
  const categories = categoriesQuery.data ?? [];
  const receipt = receiptQuery.data;

  const createStore = useMemo(() => {
    if (effectiveStoreId == null) return stores[0] ?? null;
    return stores.find((s) => Number(s.id) === Number(effectiveStoreId)) ?? stores[0] ?? null;
  }, [stores, effectiveStoreId]);

  const lineTotals = useMemo(() => {
    const source = isNew
      ? lines.filter((l) => l.productId)
      : (receipt?.lines ?? []);
    let qty = 0;
    let amount = 0;
    for (const line of source) {
      const q = Number(line.quantity) || 0;
      const price = Number(line.purchasePrice ?? line.lineCost / (q || 1)) || 0;
      qty += q;
      amount += isNew ? q * price : Number(line.lineCost ?? q * price);
    }
    return { qty, amount, count: source.length };
  }, [isNew, lines, receipt]);

  const mutation = useMutation({
    mutationFn: (body) => warehouseApi.createReceipt(body),
    onSuccess: (res) => {
      toast.success(t('stockReports.receiptCreated', { no: res.data.receiptNumber }));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['stock-receipts-list'] });
      qc.invalidateQueries({ queryKey: ['stock-receipts-report'] });
      navigate(paths.receipt(res.data.id), { replace: true });
    },
    onError: (e) => toastApiError(e, t('stockReports.receiptFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const onProductPick = (idx, product) => {
    if (!product) return;
    updateLine(idx, {
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      purchasePrice: String(product.costPrice ?? ''),
      unitSellingPrice: String(product.sellingPrice ?? product.costPrice ?? ''),
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyReceiptLine()]);
  const removeLine = (idx) => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const removeSelectedLines = (keys) => {
    const keySet = new Set(keys);
    setLines((prev) => {
      const next = prev.filter((l) => !keySet.has(l.key));
      return next.length > 0 ? next : [emptyReceiptLine()];
    });
  };

  const replaceLines = (nextLines) => {
    setLines(nextLines.length > 0 ? nextLines : [emptyReceiptLine()]);
  };

  const openCreateProduct = (idx) => {
    if (!createStore) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    setCreateLineIdx(idx);
  };

  const onProductCreated = (product, receiptMeta) => {
    if (createLineIdx == null || !product) {
      setCreateLineIdx(null);
      return;
    }
    onProductPick(createLineIdx, product);
    if (receiptMeta) {
      updateLine(createLineIdx, {
        quantity: receiptMeta.quantity || '1',
        purchasePrice: receiptMeta.purchasePrice || '',
        unitSellingPrice: receiptMeta.unitSellingPrice || '',
      });
    }
    setCreateLineIdx(null);
    invalidateProductCaches(qc);
  };

  const submit = () => {
    const sid = resolveStoreId(storeId);
    if (!sid) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    const payload = {
      supplierId: supplierId || undefined,
      storeId: sid,
      notes: notes.trim() || undefined,
      paymentType,
      lines: lines
        .filter((l) => l.productId)
        .map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          purchasePrice: Number(l.purchasePrice),
          unitSellingPrice: Number(l.unitSellingPrice),
        })),
    };
    if (payload.lines.length === 0) {
      toast.error(t('stockReports.receiptNeedLines'));
      return;
    }
    if (paymentType === 'CREDIT' && !supplierId) {
      toast.error(t('stockReports.receiptCreditNeedsSupplier'));
      return;
    }
    mutation.mutate(payload);
  };

  return {
    t,
    isNew,
    paths,
    receipt,
    receiptLoading: receiptQuery.isLoading,
    receiptError: receiptQuery.isError,
    supplierId,
    setSupplierId,
    storeId,
    setStoreId,
    notes,
    setNotes,
    paymentType,
    setPaymentType,
    lines,
    stores,
    needsStorePick,
    effectiveStoreId,
    supplierList,
    categories,
    createStore,
    createLineIdx,
    openCreateProduct,
    closeCreateProduct: () => setCreateLineIdx(null),
    onProductCreated,
    lineTotals,
    isPending: mutation.isPending,
    updateLine,
    onProductPick,
    addLine,
    removeLine,
    removeSelectedLines,
    replaceLines,
    submit,
    backToList: () => navigate(paths.receipts),
  };
}
