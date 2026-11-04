import { Plus, RefreshCw } from 'lucide-react';
import '../styles/pharmacy-receipt-marks-bar.css';

/** Draft receipt actions in document header — create / import / marks / refresh. */
export default function PharmacyReceiptDocumentDraftToolbar({
  t,
  onCreate,
  onImport,
  onRefresh,
  marksSlot = null,
}) {
  return (
    <div className="pharmacy-receipt-document-toolbar" role="toolbar" aria-label={t('pharmacyStock.inDocument')}>
      <button
        type="button"
        className="pharmacy-stock__tb-btn pharmacy-stock__tb-btn--create"
        onClick={onCreate}
      >
        <span>{t('pharmacyStock.createProduct')}</span>
        <Plus size={16} strokeWidth={2.4} aria-hidden />
      </button>
      <button
        type="button"
        className="pharmacy-stock__tb-btn pharmacy-stock__tb-btn--import"
        onClick={onImport}
      >
        <span>{t('pharmacyStock.import')}</span>
      </button>
      {marksSlot}
      <button
        type="button"
        className="pharmacy-stock__tb-btn pharmacy-stock__tb-btn--refresh"
        onClick={onRefresh}
      >
        <span>{t('pharmacyStock.toolbarRefresh')}</span>
        <RefreshCw size={15} strokeWidth={2.3} aria-hidden />
      </button>
    </div>
  );
}
