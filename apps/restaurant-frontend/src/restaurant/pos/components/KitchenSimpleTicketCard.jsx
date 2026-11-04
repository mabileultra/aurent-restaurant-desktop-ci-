import { channelLabel, isTicketOverdue, ticketTimerLabel } from '../utils/kitchenTicketMeta';
import { simplePhaseOf } from '../utils/kitchenSimpleBoard';
import '../styles/kitchen-simple.css';

export default function KitchenSimpleTicketCard({
  ticket,
  now,
  waiterName,
  canAdvance,
  advancing,
  onAdvance,
  t,
}) {
  const phase = simplePhaseOf(ticket) || 'ARRIVED';
  const overdue = isTicketOverdue(ticket, now);
  const timer = ticketTimerLabel(ticket, now);
  const channel = ticket.channel || 'DINE_IN';
  const place = channel === 'DINE_IN'
    ? t('rst.kitchen.tableCode', { code: ticket.tableCode })
    : ticket.tableCode;
  const zone = ticket.hallName || ticket.stationName || channelLabel(channel, t);

  return (
    <article
      className={[
        'rst-ks-card',
        `rst-ks-card--${phase}`,
        overdue ? 'is-overdue' : '',
      ].filter(Boolean).join(' ')}
    >
      <header className="rst-ks-card__head">
        <div className="rst-ks-card__identity">
          <span className="rst-ks-card__no">#{ticket.orderNo}</span>
          <span className="rst-ks-card__place">{place}</span>
          <span className="rst-ks-card__zone">{zone}</span>
        </div>
        <span className={`rst-ks-card__timer${overdue ? ' is-late' : ''}`}>{timer}</span>
      </header>

      <div className="rst-ks-card__meta">
        <span className="rst-ks-card__phase-pill">{t(`rst.kitchen.simple.phase.${phase}`)}</span>
        {waiterName ? <span>{waiterName}</span> : null}
        {ticket.stationName ? <span>{ticket.stationName}</span> : null}
      </div>

      <ul className="rst-ks-card__lines">
        {(ticket.lines ?? []).map((line) => (
          <li key={line.orderItemId}>
            <strong>
              {Number(line.quantity)}× {line.name}
              {line.portionText ? ` · ${line.portionText}` : ''}
            </strong>
            {(line.modifiers ?? []).length ? (
              <em>+ {(line.modifiers ?? []).join(', ')}</em>
            ) : null}
            {line.note ? <em className="rst-ks-card__note">{line.note}</em> : null}
          </li>
        ))}
      </ul>

      {canAdvance ? (
        <button
          type="button"
          className={`rst-ks-card__cta rst-ks-card__cta--${phase}`}
          disabled={advancing}
          onClick={() => onAdvance(ticket)}
        >
          {t(`rst.kitchen.simple.action.${phase}`)}
        </button>
      ) : null}
    </article>
  );
}
