import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi, storeApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { emptyTransferLine } from '../utils/stockDocumentFormUtils';

export function useStockTransferCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('receipt'); // receipt | lines
  const [receiptId, setReceiptId] = useState('');
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyTransferLine()]);

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });
  const stores = storesQuery.data ?? [];

  const receiptsQuery = useQuery({
    queryKey: ['pharmacy-receipts-posted-for-transfer'],
    queryFn: () => pharmacyWarehouseApi.listReceipts({
      status: 'POSTED',
      page: 0,
      size: 100,
    }).then((r) => r.data),
  });
  const receipts = receiptsQuery.data?.content ?? [];

  const selectedReceipt = useMemo(() => {
    const row = receipts.find((item) => String(item.id) === String(receiptId));
    if (!row) return null;
    const store = stores.find((s) => Number(s.id) === Number(row.storeId));
    return {
      ...row,
      storeName: row.storeName || store?.name || String(row.storeId ?? ''),
    };
  }, [receipts, receiptId, stores]);

  const receiptToStoreOptions = useMemo(() => {
    if (!selectedReceipt?.storeId) return stores;
    return stores.filter((store) => Number(store.id) !== Number(selectedReceipt.storeId));
  }, [stores, selectedReceipt]);

  const linesToStoreOptions = useMemo(() => {
    if (!fromStoreId) return stores;
    return stores.filter((store) => Number(store.id) !== Number(fromStoreId));
  }, [stores, fromStoreId]);

  const mutation = useMutation({
    mutationFn: ({ kind, body }) => (
      kind === 'receipt'
        ? pharmacyWarehouseApi.createTransferFromReceipt(body)
        : pharmacyWarehouseApi.createTransfer(body)
    ),
    onSuccess: (res) => {
      toast.success(t('stockReports.transferCreated', { no: res.data.transferNumber }));
      navigate('/reports/stock/transfers');
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t) || e.response?.data?.message || t('stockReports.transferFailed')),
  });

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyTransferLine()]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit = mode === 'receipt'
    ? Boolean(selectedReceipt && toStoreId)
    : Boolean(fromStoreId && toStoreId && lines.some((line) => line.productId && Number(line.quantity) > 0));

  const submit = () => {
    if (mode === 'receipt') {
      if (!selectedReceipt) {
        toast.error(t('stockReports.transferNeedReceipt'));
        return;
      }
      if (!toStoreId) {
        toast.error(t('stockReports.transferNeedToStore'));
        return;
      }
      const toStore = stores.find((store) => String(store.id) === String(toStoreId));
      const fromStore = stores.find((store) => Number(store.id) === Number(selectedReceipt.storeId));
      mutation.mutate({
        kind: 'receipt',
        body: {
          receiptId: selectedReceipt.id,
          toStoreId: Number(toStoreId),
          fromStoreName: fromStore?.name || selectedReceipt.storeName || undefined,
          toStoreName: toStore?.name || undefined,
          notes: notes.trim() || undefined,
        },
      });
      return;
    }

    if (!fromStoreId || !toStoreId) {
      toast.error(t('stockReports.transferNeedStores'));
      return;
    }
    const payloadLines = lines
      .filter((line) => line.productId && Number(line.quantity) > 0)
      .map((line) => ({ productId: line.productId, quantity: Number(line.quantity) }));
    if (!payloadLines.length) {
      toast.error(t('stockReports.transferNeedLines'));
      return;
    }
    const fromStore = stores.find((store) => String(store.id) === String(fromStoreId));
    const toStore = stores.find((store) => String(store.id) === String(toStoreId));
    mutation.mutate({
      kind: 'lines',
      body: {
        fromStoreId: Number(fromStoreId),
        toStoreId: Number(toStoreId),
        fromStoreName: fromStore?.name || undefined,
        toStoreName: toStore?.name || undefined,
        notes: notes.trim() || undefined,
        lines: payloadLines,
      },
    });
  };

  return {
    t,
    mode,
    setMode,
    receiptId,
    setReceiptId,
    fromStoreId,
    setFromStoreId,
    toStoreId,
    setToStoreId,
    notes,
    setNotes,
    lines,
    updateLine,
    addLine,
    removeLine,
    stores,
    receipts,
    receiptsLoading: receiptsQuery.isLoading,
    selectedReceipt,
    receiptToStoreOptions,
    linesToStoreOptions,
    canSubmit,
    isPending: mutation.isPending,
    submit,
  };
}
