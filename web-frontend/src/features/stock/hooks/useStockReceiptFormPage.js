import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { supplierApi, warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { emptyReceiptLine } from '../utils/stockDocumentFormUtils';
import { useStockFlowPaths } from '../stockFlowPaths';

/** Create (`/new`) or edit (`/:id/edit`) grocery stock receipt. */
export function useStockReceiptFormPage() {
  const { t } = useTranslation();
  const { id: receiptId } = useParams();
  const isEdit = Boolean(receiptId);
  const navigate = useNavigate();
  const paths = useStockFlowPaths();
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [lines, setLines] = useState([emptyReceiptLine()]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  useEffect(() => {
    if (!isEdit && onlyStore) setStoreId(String(onlyStore.id));
  }, [isEdit, onlyStore]);

  const receiptQuery = useQuery({
    queryKey: ['stock-receipt', receiptId],
    queryFn: () => warehouseApi.getReceipt(receiptId).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    const data = receiptQuery.data;
    if (!data) return;
    setReceiptNumber(data.receiptNumber || '');
    setSupplierId(data.supplierId ? String(data.supplierId) : '');
    setStoreId(data.storeId != null ? String(data.storeId) : '');
    setNotes(data.notes || '');
    setPaymentType(data.paymentType || 'CASH');
    const nextLines = (data.lines || []).map((l) => ({
      productId: l.productId,
      productName: l.productName || '',
      quantity: String(l.quantity ?? ''),
      purchasePrice: String(l.purchasePrice ?? ''),
      unitSellingPrice: String(l.unitSellingPrice ?? ''),
    }));
    setLines(nextLines.length ? nextLines : [emptyReceiptLine()]);
  }, [receiptQuery.data]);

  const effectiveStoreId = resolveStoreId(storeId);

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

  const supplierList = suppliersQuery.data?.content ?? [];

  const mutation = useMutation({
    mutationFn: (body) =>
      isEdit ? warehouseApi.updateReceipt(receiptId, body) : warehouseApi.createReceipt(body),
    onSuccess: (res) => {
      toast.success(
        t(isEdit ? 'stockReports.receiptUpdated' : 'stockReports.receiptCreated', {
          no: res.data.receiptNumber,
        })
      );
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['stock-receipts-list'] });
      navigate(paths.receiptsReport);
    },
    onError: (e) =>
      toast.error(
        e.response?.data?.message ??
          t(isEdit ? 'stockReports.receiptUpdateFailed' : 'stockReports.receiptFailed')
      ),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const onProductPick = (idx, product) => {
    if (!product) return;
    updateLine(idx, {
      productId: product.id,
      productName: product.name || '',
      purchasePrice: String(product.costPrice ?? ''),
      unitSellingPrice: String(product.sellingPrice ?? ''),
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyReceiptLine()]);

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

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
    isEdit,
    receiptNumber,
    isLoadingReceipt: isEdit && receiptQuery.isPending,
    receiptLoadError: isEdit && receiptQuery.isError,
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
    isPending: mutation.isPending,
    updateLine,
    onProductPick,
    addLine,
    removeLine,
    submit,
  };
}
