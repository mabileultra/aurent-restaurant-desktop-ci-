import { Percent, Trash2, TrendingUp, X } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import '../styles/pharmacy-receipt-line-bulk-bar.css';

export default function PharmacyReceiptLineBulkBar({
  t,
  selection,
  canRevalue,
  onVat,
  onMarkup,
  onDelete,
  deleting,
}) {
  const selected = selection.selectedCount > 0;
  if (!selected && !canRevalue) {
    return null;
  }

  return (
    <div className="pharm-line-bulk">
      <div className="pharm-line-bulk__meta">
        {selected ? (
          <span className="pharm-line-bulk__count">
            {t('pharmacyStock.selectedCount', { count: selection.selectedCount })}
          </span>
        ) : (
          <p className="pharm-line-bulk__hint">{t('pharmacyStock.bulkAllHint')}</p>
        )}
      </div>
      <div className="pharm-line-bulk__actions">
        <BaseButton size="sm" variant="secondary" disabled={!canRevalue} onClick={onVat}>
          <Percent size={14} strokeWidth={2.2} />
          {t('pharmacyStock.bulkVat')}
        </BaseButton>
        <BaseButton size="sm" variant="secondary" disabled={!canRevalue} onClick={onMarkup}>
          <TrendingUp size={14} strokeWidth={2.2} />
          {t('pharmacyStock.bulkRevalue')}
        </BaseButton>
        {selected ? (
          <BaseButton size="sm" variant="secondary" onClick={selection.clearSelection}>
            <X size={14} strokeWidth={2.2} />
            {t('pharmacyStock.clearSelection')}
          </BaseButton>
        ) : null}
        {selected && onDelete ? (
          <BaseButton size="sm" variant="danger" disabled={deleting} onClick={onDelete}>
            <Trash2 size={14} strokeWidth={2.2} />
            {t('pharmacyStock.deleteSelected')}
          </BaseButton>
        ) : null}
      </div>
    </div>
  );
}
