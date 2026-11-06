import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { lineSubtotal } from '../../../store/cartStore';
import { round2 } from '../../../utils/taxAmounts';
import '../styles/pharmacy-parked-cards.css';

function parkedTotal(ticket) {
  const lines = round2((ticket.items || []).reduce((acc, item) => acc + lineSubtotal(item), 0));
  return round2(Math.max(0, lines - (Number(ticket.orderDiscountAmount) || 0)));
}

function formatParkedTime(parkedAt) {
  if (!parkedAt) return '';
  try {
    return new Date(parkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Отложенные чеки: убрать текущий и вернуть, когда клиент нашёл деньги. */
export default function PharmacyParkedModal({
  open,
  onClose,
  parkedCarts = [],
  onPark,
  onRestore,
  onRemove,
  onClear,
}) {
  const { t } = useTranslation();
  const ordered = [...parkedCarts].sort(
    (a, b) => (Number(a.parkedAt) || 0) - (Number(b.parkedAt) || 0),
  );

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div className="pharmacy-modal pharmacy-modal__panel pharmacy-parked-modal" role="dialog" aria-modal="true" aria-label={t('pos.parkedCartsTitle')}>
        <header className="pharmacy-modal__head">
          <h2 className="pharmacy-modal__title">{t('pos.parkedCartsTitle')}</h2>
          <button type="button" className="pharmacy-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <div className="pharmacy-parked-modal__body">
          <button type="button" className="pharmacy-parked-modal__hold" onClick={onPark}>
            {t('pos.holdReceipt', { defaultValue: 'Отложить чек' })}
          </button>
          {ordered.length === 0 ? (
            <p className="pharmacy-parked-modal__empty">Нет отложенных чеков</p>
          ) : (
            <ul className="pharmacy-parked-pop__list">
              {ordered.map((ticket, index) => {
                const slot = index + 1;
                const time = formatParkedTime(ticket.parkedAt);
                const checkLabel = ticket.checkNo
                  ? t('pos.parkedCartCheck', { no: ticket.checkNo })
                  : t('pos.parkedCartUntitled');
                return (
                  <li key={ticket.id} className="pharmacy-parked-pop__item">
                    <button
                      type="button"
                      className="pharmacy-parked-pop__card"
                      title={t('pos.parkedCartRestore')}
                      onClick={() => {
                        onRestore?.(ticket.id);
                        onClose();
                      }}
                    >
                      <span className="pharmacy-parked-pop__slot" aria-hidden>{slot}</span>
                      <span className="pharmacy-parked-pop__body">
                        <span className="pharmacy-parked-pop__label">
                          {t('pharmacyCashier.parkedSlot', { n: slot, defaultValue: 'Отложенный №{{n}}' })}
                        </span>
                        <span className="pharmacy-parked-pop__check">{checkLabel}</span>
                        <span className="pharmacy-parked-pop__meta">
                          {t('pos.parkedCartMeta', { count: ticket.items?.length ?? 0, sum: fmt(parkedTotal(ticket)) })}
                          {time ? ` · ${time}` : ''}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="pharmacy-parked-pop__remove"
                      aria-label={t('pos.parkedCartRemove')}
                      onClick={() => onRemove?.(ticket.id)}
                    >
                      <Trash2 size={14} strokeWidth={2.25} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {ordered.length > 0 ? (
            <button type="button" className="pharmacy-parked-pop__clear" onClick={onClear}>
              {t('pos.parkedCartsClearAll')}
            </button>
          ) : null}
        </div>
      </div>
    </PosModalPortal>
  );
}
