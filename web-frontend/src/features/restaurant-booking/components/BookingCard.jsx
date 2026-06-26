import { Calendar, Clock, Phone, Users } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import '../styles/booking-card.css';

const STATUS_CLASS = {
  PENDING: 'booking-card--pending',
  CONFIRMED: 'booking-card--confirmed',
  SEATED: 'booking-card--seated',
  CANCELLED: 'booking-card--cancelled',
  NO_SHOW: 'booking-card--cancelled',
};

function formatDateTime(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale);
}

export default function BookingCard({
  row,
  locale,
  t,
  onConfirm,
  onEdit,
  onCancel,
  onNoShow,
}) {
  return (
    <article className={`booking-card ${STATUS_CLASS[row.status] ?? ''}`}>
      <header className="booking-card__head">
        <div>
          <div className="booking-card__client">{row.clientName}</div>
          {row.clientPhone ? (
            <div className="booking-card__phone">
              <Phone size={13} />
              <span>{row.clientPhone}</span>
            </div>
          ) : null}
        </div>
        <span className="booking-card__status">{t(`restaurantBooking.status_${row.status}`)}</span>
      </header>
      <div className="booking-card__body">
        <div className="booking-card__meta">
          <Calendar size={14} />
          <span>{formatDateTime(row.reservedAt, locale)}</span>
        </div>
        <div className="booking-card__meta">
          <Clock size={14} />
          <span>{row.durationMinutes} {t('restaurantBooking.minutesShort')}</span>
        </div>
        <div className="booking-card__meta">
          <Users size={14} />
          <span>{row.guestCount} {t('restaurantBooking.guestsShort')}</span>
        </div>
        <div className="booking-card__table">{row.hallName} / {row.tableCode}</div>
      </div>
      <footer className="booking-card__foot">
        {row.status === 'PENDING' ? (
          <BaseButton size="sm" onClick={() => onConfirm(row.id)}>{t('restaurantBooking.confirm')}</BaseButton>
        ) : null}
        <BaseButton size="sm" variant="ghost" onClick={() => onEdit(row)}>{t('common.edit')}</BaseButton>
        {row.status !== 'CANCELLED' && row.status !== 'SEATED' ? (
          <>
            <BaseButton size="sm" variant="ghost" onClick={() => onCancel(row.id)}>{t('restaurantBooking.cancel')}</BaseButton>
            {row.status === 'CONFIRMED' ? (
              <BaseButton size="sm" variant="ghost" onClick={() => onNoShow(row.id)}>{t('restaurantBooking.noShow')}</BaseButton>
            ) : null}
          </>
        ) : null}
      </footer>
    </article>
  );
}
