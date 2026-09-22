import { channelLabel, isTicketOverdue, ticketProgress, ticketTimerLabel } from '../utils/kitchenTicketMeta';
import '../styles/kitchen-kds.css';

export default function KitchenTicketCard({
  ticket,
  now,
  waiterName,
  canAdvance,
  advancing,
  onAdvance,
  t,
}) {
  const status = ticket.status;
  const overdue = isTicketOverdue(ticket, now);
  const timer = ticketTimerLabel(ticket, now);
  const progress = ticketProgress(ticket, now);
  const channel = ticket.channel || 'DINE_IN';
  const place = channel === 'DINE_IN'
    ? t('rst.kitchen.tableCode', { code: ticket.tableCode })
    : ticket.tableCode;
  const zone = ticket.hallName || ticket.stationName || channelLabel(channel, t);

  return (
    <article
      className={[
        'rst-kds-card',
        `rst-kds-card--${status}`,
        overdue ? 'is-overdue' : '',
      ].filter(Boolean).join(' ')}
    >
      <header className="rst-kds-card__head">
        <div className="rst-kds-card__head-main">
          <span className="rst-kds-card__no">#{ticket.orderNo}</span>
          <span className="rst-kds-card__place">{place}</span>
          <span className="rst-kds-card__zone">{zone}</span>
          {overdue ? <span className="rst-kds-card__alert">ALERT</span> : null}
        </div>
        <span className={`rst-kds-card__timer${overdue ? ' is-late' : ''}`}>{timer}</span>
      </header>

      <div className="rst-kds-card__meta">
        {waiterName ? <span>{t('rst.floor.waiter')}: {waiterName}</span> : null}
        {ticket.clientName ? <span>{ticket.clientName}</span> : null}
        {ticket.stationName ? <span>{ticket.stationName}</span> : null}
      </div>

      <ul className="rst-kds-card__lines">
        {(ticket.lines ?? []).map((line) => (
          <li key={line.orderItemId} className="rst-kds-card__line">
            <div className="rst-kds-card__line-main">
              {status === 'READY' ? <span className="rst-kds-card__check" aria-hidden>✓</span> : null}
              <strong>{Number(line.quantity)}× {line.name}</strong>
              {status === 'PREPARING' && overdue ? (
                <em className="rst-kds-card__ready-pill">{t('rst.kitchen.lineReady')}</em>
              ) : null}
            </div>
            <div className="rst-kds-card__tags">
              {(line.modifiers ?? []).map((mod) => (
                <span key={mod} className="rst-kds-card__tag rst-kds-card__tag--mod">+ {mod}</span>
              ))}
              {line.note ? (
                <span className="rst-kds-card__tag rst-kds-card__tag--note">{line.note}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {status === 'PREPARING' ? (
        <div className="rst-kds-card__progress">
          <span>{t('rst.kitchen.cookingProgress', { value: progress })}</span>
          <div className="rst-kds-card__bar" aria-hidden>
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {status === 'READY' ? (
        <div className="rst-kds-card__wait">{t('rst.kitchen.waitingServe')}</div>
      ) : null}

      {canAdvance ? (
        <div className="rst-kds-card__actions">
          <button
            type="button"
            className={`rst-kds-card__cta rst-kds-card__cta--${status}`}
            disabled={advancing}
            onClick={() => onAdvance(ticket)}
          >
            {t(`rst.kitchen.action.${status}`)}
          </button>
        </div>
      ) : null}
    </article>
  );
}
