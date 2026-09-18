import { Pencil, Trash2 } from 'lucide-react';

export function PharmacySelectAllTh({ t, selection, disabled = false }) {
  return (
    <th className="pharmacy-stock__check">
      <input
        ref={selection.selectAllRef}
        type="checkbox"
        className="pharmacy-stock__checkbox"
        checked={selection.allPageSelected}
        disabled={disabled}
        onChange={selection.toggleSelectAllPage}
        aria-label={t('pharmacyStock.selectAll')}
        title={t('pharmacyStock.selectAll')}
      />
    </th>
  );
}

export function PharmacySelectCell({ t, row, selection, disabled = false }) {
  return (
    <td className="pharmacy-stock__check" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        className="pharmacy-stock__checkbox"
        checked={selection.isSelected(row.id)}
        disabled={disabled}
        onChange={() => selection.toggleSelect(row)}
        aria-label={t('pharmacyStock.selectRow')}
        title={t('pharmacyStock.selectRow')}
      />
    </td>
  );
}

export function PharmacySelectionBar({ t, selection, children }) {
  if (!selection.selectedCount) return null;
  return (
    <div className="pharmacy-stock__selection">
      <span>{t('pharmacyStock.selectedCount', { count: selection.selectedCount })}</span>
      {children}
      <button type="button" className="pharmacy-stock__row-btn" onClick={selection.clearSelection}>
        {t('pharmacyStock.clearSelection')}
      </button>
    </div>
  );
}

export function PharmacyEditButton({ t, onEdit }) {
  return (
    <button
      type="button"
      className="pharmacy-stock__icon-btn"
      title={t('common.edit')}
      aria-label={t('common.edit')}
      onClick={onEdit}
    >
      <Pencil size={15} strokeWidth={2} />
    </button>
  );
}

export function PharmacyEditCell({ t, onEdit, onDelete, children }) {
  return (
    <td className="pharmacy-stock__row-actions" onClick={(e) => e.stopPropagation()}>
      <div className="pharmacy-stock__icon-row">
        {onEdit ? <PharmacyEditButton t={t} onEdit={onEdit} /> : null}
        {onDelete ? (
          <button
            type="button"
            className="pharmacy-stock__icon-btn pharmacy-stock__icon-btn--danger"
            title={t('common.delete')}
            aria-label={t('common.delete')}
            onClick={onDelete}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        ) : null}
        {children}
      </div>
    </td>
  );
}
