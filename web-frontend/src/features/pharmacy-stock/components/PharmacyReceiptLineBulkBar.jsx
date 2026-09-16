export default function PharmacyReceiptLineBulkBar({
  t,
  selection,
  canRevalue,
  onVat,
  onMarkup,
  onDelete,
  deleting,
}) {
  return (
    <div className="pharmacy-stock__line-bulk">
      <button type="button" className="pharmacy-stock__row-btn" disabled={!canRevalue} onClick={onVat}>
        {t('pharmacyStock.bulkVat')}
      </button>
      <button type="button" className="pharmacy-stock__row-btn" disabled={!canRevalue} onClick={onMarkup}>
        {t('pharmacyStock.bulkRevalue')}
      </button>
      {selection.selectedCount ? (
        <>
          <span>{t('pharmacyStock.selectedCount', { count: selection.selectedCount })}</span>
          {onDelete ? (
            <button
              type="button"
              className="pharmacy-stock__row-btn pharmacy-stock__row-btn--danger"
              disabled={deleting}
              onClick={onDelete}
            >
              {t('pharmacyStock.deleteSelected')}
            </button>
          ) : null}
          <button type="button" className="pharmacy-stock__row-btn" onClick={selection.clearSelection}>
            {t('pharmacyStock.clearSelection')}
          </button>
        </>
      ) : canRevalue ? (
        <span className="pharmacy-stock__line-bulk-hint">{t('pharmacyStock.bulkAllHint')}</span>
      ) : null}
    </div>
  );
}
