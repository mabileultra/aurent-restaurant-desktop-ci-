import { Trash2, Undo2 } from 'lucide-react';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';
import { lineSubtotal } from '../../../../store/cartStore';
import { round2 } from '../../../../utils/taxAmounts';

function parkedTotal(ticket) {
  const lines = round2((ticket.items || []).reduce((acc, item) => acc + lineSubtotal(item), 0));
  return round2(Math.max(0, lines - (Number(ticket.orderDiscountAmount) || 0)));
}

export default function PosParkedCartsBar({
  t,
  parkedCarts = [],
  onRestore,
  onRemove,
  onClearAll,
}) {
  if (!parkedCarts.length) return null;

  return (
    <div className="pos-parked-bar" role="region" aria-label={t('pos.parkedCartsTitle')}>
      <div className="pos-parked-bar__head">
        <span className="pos-parked-bar__title">
          {t('pos.parkedCartsTitle')}
          <span className="pos-parked-bar__count">{parkedCarts.length}</span>
        </span>
        <button
          type="button"
          className="pos-parked-bar__clear-all"
          onClick={onClearAll}
        >
          {t('pos.parkedCartsClearAll')}
        </button>
      </div>
      <ul className="pos-parked-bar__list">
        {parkedCarts.map((ticket) => {
          const positions = ticket.items?.length ?? 0;
          const total = parkedTotal(ticket);
          const label = ticket.checkNo
            ? t('pos.parkedCartCheck', { no: ticket.checkNo })
            : t('pos.parkedCartUntitled');
          return (
            <li key={ticket.id} className="pos-parked-bar__item">
              <button
                type="button"
                className="pos-parked-bar__restore"
                onClick={() => onRestore?.(ticket.id)}
                title={t('pos.parkedCartRestore')}
              >
                <Undo2 size={14} strokeWidth={2.25} aria-hidden />
                <span className="pos-parked-bar__meta">
                  <span className="pos-parked-bar__name">{label}</span>
                  <span className="pos-parked-bar__sub">
                    {t('pos.parkedCartMeta', { count: positions, sum: fmt(total) })}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="pos-parked-bar__remove"
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
