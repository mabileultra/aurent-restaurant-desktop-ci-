import { useEffect, useState } from 'react';
import { tableActiveOrders } from '../utils/floorStatusFilters';
import { tableStatusClass } from '../utils/tableStatus';
import { formatDigitalTimer, formatElapsed } from '../utils/formatElapsed';
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

function StatusIcon({ status }) {
  const props = {
    className: 'rst-table-card__ico',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (status === 'CLEANING') {
    return (
      <svg {...props}>
        <path d="M4 20h16" />
        <path d="M9 20V9l-3 2" />
        <path d="M15 20V5l4 3" />
        <path d="M9 13h6" />
      </svg>
    );
  }
  if (status === 'RESERVED') {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (status === 'FREE') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (status === 'OCCUPIED') {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </svg>
    );
  }
  if (status === 'WAITING_PAYMENT') {
    return (
      <svg {...props}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </svg>
  );
}

function WaiterRow({ name, emptyLabel }) {
  return (
    <div className="rst-table-card__waiter">
      <svg className="rst-table-card__waiter-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </svg>
      <span>{name || emptyLabel}</span>
    </div>
  );
}

export default function FloorTableCard({ table, selected, onClick, t, now, waiterNameById }) {
  const status = tableStatusClass(table.status);
  const orders = tableActiveOrders(table);
  const order = orders[0] || table.activeOrder;
  const checksSum = orders.reduce((sum, row) => sum + Number(row.subtotal || 0), 0);
  const reservation = table.reservation;
  const elapsed = order?.openedAt ? formatElapsed(order.openedAt, now) : null;
  const cleaningTimer = status === 'CLEANING' && table.updatedAt
    ? formatDigitalTimer(table.updatedAt, now)
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
        <span className="rst-table-card__badge">{table.code}</span>
        <span className="rst-table-card__status">
          <StatusIcon status={status} />
          {t(`rst.status.${status}`)}
        </span>
      </div>

      <div className="rst-table-card__body">
        {order && (status === 'OCCUPIED' || status === 'WAITING_PAYMENT') ? (
          <>
            <div className="rst-table-card__amount">{fmtMoneyCompact(orders.length > 1 ? checksSum : order.subtotal)}</div>
            <div className="rst-table-card__meta-line">
              <span>
                {orders.length > 1
                  ? t('rst.order.checksCount', { count: orders.length })
                  : t('rst.floor.checkNo', { no: order.orderNo })}
              </span>
              {elapsed ? <span>{elapsed}</span> : null}
            </div>
            <WaiterRow name={waiterName} emptyLabel={t('rst.floor.waiterNone')} />
            {order?.linkedTableCodes?.length ? (
              <div className="rst-table-card__hint">
                {table.code} + {order.linkedTableCodes.join(' + ')}
              </div>
            ) : null}
            {status === 'WAITING_PAYMENT' ? (
              <div className="rst-table-card__hint">{t('rst.floor.billReadyHint')}</div>
            ) : (
              <div className="rst-table-card__meta-line muted">
                <span>{t('rst.order.guestsShort', { count: order.guestCount })}</span>
                <span>{t('rst.floor.linesShort', { count: order.linesCount })}</span>
              </div>
            )}
          </>
        ) : reservation || status === 'RESERVED' ? (
          <>
            <div className="rst-table-card__guest">
              {reservation?.clientName || t('rst.status.RESERVED')}
            </div>
            <div className="rst-table-card__meta-line">
              <span>
                {t('rst.floor.guestsCount', {
                  count: reservation?.guestCount ?? table.seatCount,
                })}
              </span>
              <span>{formatReserveTime(reservation?.reservedAt) || '—'}</span>
            </div>
            {reservation?.notes ? (
              <div className="rst-table-card__quote">«{reservation.notes}»</div>
            ) : null}
          </>
        ) : status === 'CLEANING' ? (
          <>
            <div className="rst-table-card__timer">{cleaningTimer || '00:00'}</div>
            <div className="rst-table-card__hint">
              {table.label || t('rst.floor.cleaningHint')}
            </div>
          </>
        ) : status === 'FREE' ? (
          <>
            <div className="rst-table-card__seats">
              {t('rst.floor.seats', { count: table.seatCount })}
            </div>
            {table.label ? <div className="rst-table-card__hint">{table.label}</div> : null}
            <WaiterRow name={null} emptyLabel={`${t('rst.floor.waiter')}: ${t('rst.floor.waiterNone')}`} />
          </>
        ) : status === 'BLOCKED' ? (
          <>
            <div className="rst-table-card__guest">{t('rst.status.BLOCKED')}</div>
            <div className="rst-table-card__hint">
              {table.label || t('rst.floor.blockedHint')}
            </div>
          </>
        ) : (
          <div className="rst-table-card__hint">{table.label || t(`rst.status.${status}`)}</div>
        )}
      </div>

      <span className="rst-table-card__cta">{statusActionLabel(status, t)}</span>
    </button>
  );
}

export function useNowTick(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
