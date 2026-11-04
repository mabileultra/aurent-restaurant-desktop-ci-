import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { categoryApi } from '../../../../api/category.api';
import RstModal from '../../../../restaurant/shared/components/RstModal';
import { BaseButton } from '../../../../components/ui';
import { toastApiError } from '../../../../utils/apiError';

export default function CategoryDeleteModal({ category, onClose }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => categoryApi.delete(category.id),
    onSuccess: () => {
      toast.success(t('categories.deleted'));
      qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('categories') });
      onClose();
    },
    onError: (e) => {
      toastApiError(e, t('categories.deleteFailed'));
    },
  });

  if (!category) return null;

  return (
    <RstModal
      open
      title={t('categories.deleteTitle')}
      onClose={onClose}
      footer={(
        <>
          <BaseButton type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {t('categories.rowDelete')}
          </BaseButton>
        </>
      )}
    >
      <p className="rst-categories__delete-hint">
        {t('categories.deleteHint', { name: category.name })}
      </p>
    </RstModal>
  );
}
