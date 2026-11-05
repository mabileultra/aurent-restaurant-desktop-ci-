import PosModalPortal from '../../../components/shared/PosModalPortal';
import PharmacyPreviewReceipt from './PharmacyPreviewReceipt';

/** Предварительный чек в модалке. */
export default function PharmacyPreviewModal({ open, onClose, receiptNo, items, total, onPrint }) {
  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div className="pharmacy-modal pharmacy-modal__panel pharmacy-preview-modal" role="dialog" aria-modal="true" aria-label="Предварительный чек">
        <button type="button" className="pharmacy-modal__close pharmacy-preview-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        <PharmacyPreviewReceipt receiptNo={receiptNo} items={items} total={total} onPrint={onPrint} />
      </div>
    </PosModalPortal>
  );
}
