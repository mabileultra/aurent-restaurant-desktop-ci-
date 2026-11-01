import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';

export function useStockReceiptsActions() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => warehouseApi.deleteReceipt(id),
    onSuccess: () => {
      toast.success(t('stockReports.receiptDeleted'));
      invalidateProductCaches(qc);
      qc.invalidateQueries({ queryKey: ['stock-receipts-list'] });
    },
    onError: (e) => {
      toast.error(e.response?.data?.message ?? t('stockReports.receiptDeleteFailed'));
    },
  });

  const confirmDelete = (row) => {
    const ok = window.confirm(
      t('stockReports.receiptDeleteConfirm', { no: row.receiptNumber || '' })
    );
    if (!ok) return;
    deleteMutation.mutate(row.id);
  };

  return {
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,
    confirmDelete,
  };
}
