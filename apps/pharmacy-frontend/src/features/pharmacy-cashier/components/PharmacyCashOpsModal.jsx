import { QrCode, Split } from 'lucide-react';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import { PAYMENT_PROVIDER_LOGOS } from '../../cashier/constants/paymentProviderLogos';

const TYPES = [
  { id: 'mixed', label: 'Смешанная оплата', icon: Split },
  { id: 'CLICK', label: 'Click', logo: PAYMENT_PROVIDER_LOGOS.CLICK },
  { id: 'PAYME', label: 'Payme', logo: PAYMENT_PROVIDER_LOGOS.PAYME },
  { id: 'cashless', label: 'Бесконтакт', icon: QrCode },
];

/** Типы оплаты, которых нет на левой колонке. */
export default function PharmacyCashOpsModal({ open, onClose, onPick }) {
  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div className="pharmacy-modal pharmacy-modal__panel pharmacy-cash-ops" role="dialog" aria-modal="true" aria-label="Денежные операции">
        <header className="pharmacy-modal__head">
          <h2>Денежные операции</h2>
          <button type="button" className="pharmacy-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <div className="pharmacy-cash-ops__list">
          {TYPES.map((type) => {
            const Icon = type.icon;
            return (
            <button
              key={type.id}
              type="button"
              className="pharmacy-cash-ops__btn"
              onClick={() => onPick(type.id)}
            >
              {type.logo ? <img src={type.logo} alt="" /> : <Icon size={22} strokeWidth={2.1} aria-hidden />}
              <span>{type.label}</span>
            </button>
            );
          })}
        </div>
      </div>
    </PosModalPortal>
  );
}
