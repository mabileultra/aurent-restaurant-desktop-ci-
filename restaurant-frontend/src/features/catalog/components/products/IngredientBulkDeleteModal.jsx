import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BaseButton, BaseModal } from '../../../../components/ui';
import { productApi } from '../../../../api';
import { invalidateProductCaches } from '../../../../utils/productCache';
import { toastApiError } from '../../../../utils/apiError';

export default function IngredientBulkDeleteModal({ t, productIds, onClose, onDone }) {
  const qc = useQueryClient();
  const count = productIds.size;

  const { mutate, isPending } = useMutation({
    mutationFn: () => productApi.bulkDeactivate({ productIds: [...productIds] }),
    onSuccess: () => {
      toast.success(t('rst.nomenclature.bulkDeleteSuccess', { count }));
      invalidateProductCaches(qc);
      onDone?.();
    },
    onError: (e) => toastApiError(e, t('rst.nomenclature.bulkDeleteFailed')),
  });

  return (
    <BaseModal
      open
      title={t('rst.nomenclature.bulkDeleteTitle')}
      onClose={onClose}
      size="sm"
      footer={(
        <>
          <BaseButton type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton type="button" variant="danger" onClick={() => mutate()} disabled={isPending}>
            {isPending ? t('common.saving') : t('rst.nomenclature.bulkDeleteSubmit')}
          </BaseButton>
        </>
      )}
    >
      <p>{t('rst.nomenclature.bulkDeleteHint', { count })}</p>
      <p className="rst-coming__text">{t('rst.nomenclature.bulkDeleteNote')}</p>
    </BaseModal>
  );
}
