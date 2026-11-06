import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { tenantBillingApi } from '../../../api';

export function useTenantBillingLedgerActions({ ledger, ledgerTotal, ledgerPage, setLedgerPage, ledgerLoading, refresh }) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [detailRow, setDetailRow] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const selectAllRef = useRef(null);

  const pageIds = useMemo(() => ledger.map((row) => row.id), [ledger]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  useEffect(() => {
    if (!ledgerLoading && ledger.length === 0 && ledgerPage > 0) {
      setLedgerPage((page) => Math.max(0, page - 1));
    }
  }, [ledgerLoading, ledger.length, ledgerPage, setLedgerPage]);

  const onLedgerDeleted = () => {
    setConfirm(null);
    setDetailRow(null);
    refresh();
  };

  const deleteOneM = useMutation({
    mutationFn: (id) => tenantBillingApi.deleteLedgerEntry(id),
    onSuccess: (_data, id) => {
      toast.success(t('billing.ledgerDeleted'));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onLedgerDeleted();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.ledgerDeleteFailed')),
  });

  const deleteSelectedM = useMutation({
    mutationFn: (ids) => tenantBillingApi.deleteLedgerEntries(ids),
    onSuccess: () => {
      toast.success(t('billing.ledgerDeleted'));
      setSelectedIds(new Set());
      onLedgerDeleted();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.ledgerDeleteFailed')),
  });

  const deleteAllM = useMutation({
    mutationFn: () => tenantBillingApi.deleteAllLedger(),
    onSuccess: () => {
      toast.success(t('billing.ledgerDeleted'));
      setSelectedIds(new Set());
      setLedgerPage(0);
      onLedgerDeleted();
    },
    onError: (e) => toast.error(e?.response?.data?.message || e?.message || t('billing.ledgerDeleteFailed')),
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const openDetail = (row) => {
    setDetailRow(row);
    tenantBillingApi
      .ledgerEntry(row.id)
      .then((r) => {
        setDetailRow((current) => (current?.id === row.id ? r.data : current));
      })
      .catch(() => {});
  };

  const openDeleteOne = (row) => {
    setDetailRow(null);
    setConfirm({ type: 'one', row });
  };

  const openDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDetailRow(null);
    setConfirm({ type: 'selected' });
  };

  const openDeleteAll = () => {
    if (ledgerTotal === 0) return;
    setDetailRow(null);
    setConfirm({ type: 'all' });
  };

  const confirmDelete = () => {
    if (confirm?.type === 'one' && confirm.row) {
      deleteOneM.mutate(confirm.row.id);
      return;
    }
    if (confirm?.type === 'selected') {
      deleteSelectedM.mutate([...selectedIds]);
      return;
    }
    if (confirm?.type === 'all') {
      deleteAllM.mutate();
    }
  };

  const confirmHint = confirm?.type === 'one'
    ? t('billing.ledgerDeleteOneHint')
    : confirm?.type === 'selected'
      ? t('billing.ledgerDeleteSelectedHint', { count: selectedIds.size })
      : t('billing.ledgerDeleteAllHint');

  return {
    selectedIds,
    setSelectedIds,
    allPageSelected,
    selectAllRef,
    toggleSelect,
    toggleSelectAllPage,
    detailRow,
    closeDetail: () => setDetailRow(null),
    openDetail,
    openDeleteOne,
    openDeleteSelected,
    openDeleteAll,
    confirm,
    closeConfirm: () => setConfirm(null),
    confirmDelete,
    confirmHint,
    deleting: deleteOneM.isPending || deleteSelectedM.isPending || deleteAllM.isPending,
  };
}
