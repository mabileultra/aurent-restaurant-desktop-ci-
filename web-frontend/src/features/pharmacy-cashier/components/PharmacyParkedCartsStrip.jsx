import { Trash2 } from 'lucide-react';
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

/** Горизонтальные карточки отложенных чеков (pharmacy POS). №1 = самый старый. */
export default function PharmacyParkedCartsStrip({
  t,
  parkedCarts = [],
  onRestore,
  onRemove,
  onClearAll,
}) {
  if (!parkedCarts.length) return null;

  const ordered = [...parkedCarts].sort(
    (a, b) => (Number(a.parkedAt) || 0) - (Number(b.parkedAt) || 0),
  );

  return (
    <div
      className="pharmacy-parked-cards"
      role="region"
      aria-label={t('pos.parkedCartsTitle')}
    >
      <div className="pharmacy-parked-cards__head">
        <span className="pharmacy-parked-cards__title">
          {t('pos.parkedCartsTitle')}
          <span className="pharmacy-parked-cards__count">{ordered.length}</span>
        </span>
        <button
          type="button"
          className="pharmacy-parked-cards__clear-all"
          onClick={onClearAll}
        >
          {t('pos.parkedCartsClearAll')}
        </button>
      </div>

      <ul className="pharmacy-parked-cards__list">
        {ordered.map((ticket, index) => {
          const slot = index + 1;
          const positions = ticket.items?.length ?? 0;
          const total = parkedTotal(ticket);
          const time = formatParkedTime(ticket.parkedAt);
          const checkLabel = ticket.checkNo
            ? t('pos.parkedCartCheck', { no: ticket.checkNo })
            : t('pos.parkedCartUntitled');

          return (
            <li key={ticket.id} className="pharmacy-parked-cards__item">
              <button
                type="button"
                className="pharmacy-parked-cards__card"
                onClick={() => onRestore?.(ticket.id)}
                title={t('pos.parkedCartRestore')}
              >
                <span className="pharmacy-parked-cards__slot" aria-hidden>
                  {slot}
                </span>
                <span className="pharmacy-parked-cards__body">
                  <span className="pharmacy-parked-cards__slot-label">
                    {t('pharmacyCashier.parkedSlot', {
                      n: slot,
                      defaultValue: 'Отложенный №{{n}}',
                    })}
                  </span>
                  <span className="pharmacy-parked-cards__check">{checkLabel}</span>
                  <span className="pharmacy-parked-cards__meta">
                    {t('pos.parkedCartMeta', { count: positions, sum: fmt(total) })}
                    {time ? ` · ${time}` : ''}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="pharmacy-parked-cards__remove"
                onClick={() => onRemove?.(ticket.id)}
                aria-label={t('pos.parkedCartRemove')}
                title={t('pos.parkedCartRemove')}
              >
                <Trash2 size={14} strokeWidth={2.25} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
