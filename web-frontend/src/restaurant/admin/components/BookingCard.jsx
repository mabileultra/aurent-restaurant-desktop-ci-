import { BaseButton } from '../../../components/ui';

function formatDateTime(value, locale) {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale);
}

export default function BookingCard({
  row,
  locale,
  t,
  onConfirm,
  onSeat,
  onEdit,
  onCancel,
  onNoShow,
}) {
  return (
    <article className={`rst-booking-card rst-booking-card--${row.status}`}>
      <header className="rst-booking-card__head">
        <div>
          <div className="rst-booking-card__client">{row.clientName}</div>
          {row.clientPhone ? <div className="rst-booking-card__phone">{row.clientPhone}</div> : null}
        </div>
        <span className="rst-booking-card__status">{t(`rst.booking.status_${row.status}`)}</span>
      </header>
      <div className="rst-booking-card__body">
        <div>{formatDateTime(row.reservedAt, locale)}</div>
        <div>{row.durationMinutes} {t('rst.booking.minutesShort')} · {row.guestCount} {t('rst.booking.guestsShort')}</div>
        <div className="rst-booking-card__table">{row.hallName} / {row.tableCode}</div>
      </div>
      <footer className="rst-booking-card__foot">
        {row.status === 'PENDING' ? (
          <BaseButton size="sm" onClick={() => onConfirm(row.id)}>{t('rst.booking.confirm')}</BaseButton>
        ) : null}
        {row.status === 'CONFIRMED' || row.status === 'PENDING' ? (
          <BaseButton size="sm" variant="ghost" onClick={() => onSeat(row.id)}>{t('rst.booking.seat')}</BaseButton>
        ) : null}
        {row.status !== 'SEATED' && row.status !== 'CANCELLED' && row.status !== 'NO_SHOW' ? (
          <BaseButton size="sm" variant="ghost" onClick={() => onEdit(row)}>{t('common.edit')}</BaseButton>
        ) : null}
        {row.status !== 'CANCELLED' && row.status !== 'SEATED' && row.status !== 'NO_SHOW' ? (
          <BaseButton size="sm" variant="ghost" onClick={() => onCancel(row.id)}>{t('rst.booking.cancel')}</BaseButton>
        ) : null}
        {row.status === 'CONFIRMED' ? (
          <BaseButton size="sm" variant="ghost" onClick={() => onNoShow(row.id)}>{t('rst.booking.noShow')}</BaseButton>
        ) : null}
      </footer>
    </article>
  );
}
