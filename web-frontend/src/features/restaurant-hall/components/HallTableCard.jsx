import { Armchair, UtensilsCrossed } from 'lucide-react';
import '../styles/hall-table-card.css';

const STATUS_CLASS = {
  FREE: 'hall-table-card--free',
  OCCUPIED: 'hall-table-card--occupied',
  RESERVED: 'hall-table-card--reserved',
};

const BADGE_CLASS = {
  FREE: 'hall-table-card__badge--free',
  OCCUPIED: 'hall-table-card__badge--occupied',
  RESERVED: 'hall-table-card__badge--reserved',
};

export default function HallTableCard({ table, onClick, t }) {
  const status = table.status ?? 'FREE';

  return (
    <button
      type="button"
      className={`hall-table-card ${STATUS_CLASS[status] ?? STATUS_CLASS.FREE}`}
      onClick={() => onClick?.(table)}
    >
      <div className="hall-table-card__icon">
        <UtensilsCrossed size={28} strokeWidth={1.75} />
      </div>
      <div className="hall-table-card__code">{table.code}</div>
      <div className="hall-table-card__seats">
        <Armchair size={14} />
        <span>{t('restaurantHall.seatsCount', { count: table.seatCount })}</span>
      </div>
      <span className={`hall-table-card__badge ${BADGE_CLASS[status] ?? BADGE_CLASS.FREE}`}>
        {t(`restaurantHall.status_${status}`)}
      </span>
    </button>
  );
}
