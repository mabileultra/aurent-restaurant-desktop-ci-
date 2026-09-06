import { useEffect, useState } from 'react';
import { tableStatusClass } from '../utils/tableStatus';
import { formatElapsed } from '../utils/formatElapsed';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/floor-table-grid.css';

function statusActionLabel(status, t) {
  switch (status) {
    case 'FREE':
      return t('rst.floor.actionOpen');
    case 'OCCUPIED':
      return t('rst.floor.actionOpenCheck');
    case 'WAITING_PAYMENT':
      return t('rst.floor.actionAcceptPay');
    case 'RESERVED':
      return t('rst.floor.actionSeat');
    case 'CLEANING':
      return t('rst.floor.actionReady');
    case 'BLOCKED':
      return t('rst.floor.actionUnblock');
    default:
      return t('rst.floor.actionOpen');
  }
}

function formatReserveTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function FloorTableCard({ table, selected, onClick, t, now, waiterNameById }) {
  const status = tableStatusClass(table.status);
  const order = table.activeOrder;
  const reservation = table.reservation;
  const elapsed = order?.openedAt ? formatElapsed(order.openedAt, now) : null;
  const cleaningElapsed = status === 'CLEANING' && table.updatedAt
    ? formatElapsed(table.updatedAt, now)
    : null;
  const waiterName = order?.waiterUserId
    ? (waiterNameById?.get(String(order.waiterUserId)) || t('rst.floor.waiterUnknown'))
    : null;

  return (
    <button
      type="button"
      className={`rst-table-card rst-table-card--${status}${selected ? ' is-selected' : ''}`}
      onClick={() => onClick(table)}
    >
      <div className="rst-table-card__top">
        <strong className="rst-table-card__code">{table.code}</strong>
        <span className="rst-table-card__status">
          <span className="rst-table-card__dot" aria-hidden />
          {t(`rst.status.${status}`)}
        </span>
      </div>

      <div className="rst-table-card__body">
        {order ? (
          <>
            <div className="rst-table-card__amount">{fmtMoneyCompact(order.subtotal)}</div>
            <div className="rst-table-card__row">
              <span>#{order.orderNo}</span>
              {elapsed ? <span>{elapsed}</span> : null}
            </div>
            <div className="rst-table-card__row">
              <span>{t('rst.order.guestsShort', { count: order.guestCount })}</span>
              <span>{t('rst.floor.linesShort', { count: order.linesCount })}</span>
            </div>
            <div className="rst-table-card__waiter">
              {t('rst.floor.waiter')}: {waiterName || t('rst.floor.waiterNone')}
            </div>
          </>
        ) : reservation ? (
          <>
            <div className="rst-table-card__seats">{reservation.clientName}</div>
            <div className="rst-table-card__row">
              <span>{t('rst.order.guestsShort', { count: reservation.guestCount })}</span>
              <span>{formatReserveTime(reservation.reservedAt)}</span>
            </div>
            {reservation.notes ? (
              <div className="rst-table-card__hint">{reservation.notes}</div>
            ) : null}
          </>
        ) : status === 'FREE' ? (
          <>
            <div className="rst-table-card__seats">
              {t('rst.floor.seats', { count: table.seatCount })}
            </div>
            <div className="rst-table-card__hint">{table.label || t('rst.floor.readyHint')}</div>
          </>
        ) : status === 'CLEANING' ? (
          <>
            <div className="rst-table-card__seats">
              {cleaningElapsed || t('rst.status.CLEANING')}
            </div>
            <div className="rst-table-card__hint">{table.label || t('rst.floor.cleaningHint')}</div>
          </>
        ) : (
          <div className="rst-table-card__hint">{table.label || t(`rst.status.${status}`)}</div>
        )}
      </div>

      <span className="rst-table-card__cta">{statusActionLabel(status, t)}</span>
    </button>
  );
}

export function useNowTick(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
