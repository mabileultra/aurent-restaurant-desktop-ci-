import KitchenSimpleTicketCard from './KitchenSimpleTicketCard';
import { SIMPLE_PHASES } from '../utils/kitchenSimpleBoard';
import '../styles/kitchen-simple.css';

export default function KitchenSimpleBoard({
  phases,
  now,
  waiterNameById,
  canAdvance,
  advancing,
  onAdvance,
  t,
}) {
  return (
    <div className="rst-ks" role="list">
      {SIMPLE_PHASES.map((phase) => (
        <section
          key={phase}
          className={`rst-ks__lane rst-ks__lane--${phase}`}
          aria-label={t(`rst.kitchen.simple.phase.${phase}`)}
        >
          <h2 className="rst-ks__lane-title">
            <span className="rst-ks__lane-dot" aria-hidden />
            {t(`rst.kitchen.simple.phase.${phase}`)}
            <span className="rst-ks__lane-count">{(phases[phase] || []).length}</span>
          </h2>
          <div className="rst-ks__cards">
            {(phases[phase] || []).map((ticket) => (
              <KitchenSimpleTicketCard
                key={ticket.id}
                ticket={ticket}
                now={now}
                waiterName={
                  ticket.waiterUserId
                    ? waiterNameById.get(String(ticket.waiterUserId))
                    : null
                }
                canAdvance={canAdvance}
                advancing={advancing}
                onAdvance={onAdvance}
                t={t}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
