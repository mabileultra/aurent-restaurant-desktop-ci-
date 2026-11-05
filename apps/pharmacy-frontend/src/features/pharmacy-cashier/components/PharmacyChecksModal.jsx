import PosModalPortal from '../../../components/shared/PosModalPortal';
import CashierMySalesPage from '../../cashier/pages/CashierMySalesPage';

/** Чеки кассы — те же «Мои продажи», что в продукте. */
export default function PharmacyChecksModal({ open, onClose }) {
  if (!open) return null;

  return (
    <PosModalPortal open={open} onClose={onClose} overlayClassName="pharmacy-checks-overlay">
      <div className="pharmacy-checks-modal cashier-app cashier-app--light" role="dialog" aria-modal="true" aria-label="Мои продажи">
        <button type="button" className="pharmacy-checks-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        <CashierMySalesPage />
      </div>
    </PosModalPortal>
  );
}
