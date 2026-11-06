import { Pencil, Trash2 } from 'lucide-react';

export default function FinanceDetailActions({ t, onEdit, onDelete, editLabel }) {
  if (!onEdit && !onDelete) return null;

  return (
    <>
      {onEdit ? (
        <button type="button" className="finance-detail-modal__btn-edit" onClick={onEdit}>
          <Pencil size={16} />
          {editLabel ?? t('common.edit')}
        </button>
      ) : null}
      {onDelete ? (
        <button type="button" className="finance-detail-modal__btn-delete" onClick={onDelete} aria-label={t('common.delete')}>
          <Trash2 size={18} />
        </button>
      ) : null}
    </>
  );
}
