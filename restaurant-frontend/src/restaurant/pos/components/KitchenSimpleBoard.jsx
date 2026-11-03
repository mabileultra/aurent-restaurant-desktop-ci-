import KitchenSimpleTicketCard from './KitchenSimpleTicketCard';
import { SIMPLE_PHASES } from '../utils/kitchenSimpleBoard';
import '../styles/kitchen-simple.css';

const LANE_STAT_KEY = {
  ARRIVED: 'rst.kitchen.statInWork',
  COOKING: 'rst.kitchen.statOverdue',
  READY: 'rst.kitchen.statReady',
};

export default function KitchenSimpleBoard({
  phases,
  stats,
  now,
  waiterNameById,
  canAdvance,
  advancing,
  onAdvance,
  t,
}) {
  const laneValue = {
    ARRIVED: stats?.inWork ?? (phases.ARRIVED || []).length,
    COOKING: stats?.overdue ?? 0,
    READY: stats?.ready ?? (phases.READY || []).length,
  };

  return (
    <div className="rst-ks" role="list">
      {SIMPLE_PHASES.map((phase) => (
        <section
          key={phase}
          className={`rst-ks__lane rst-ks__lane--${phase}`}
          aria-label={t(`rst.kitchen.simple.phase.${phase}`)}
        >
          <h2 className={`rst-ks__lane-title${phase === 'COOKING' ? ' rst-ks__lane-title--late' : ''}`}>
            <span className="rst-ks__lane-label">{t(LANE_STAT_KEY[phase])}</span>
            <strong className="rst-ks__lane-count">{laneValue[phase]}</strong>
            <span className="rst-ks__lane-phase">{t(`rst.kitchen.simple.phase.${phase}`)}</span>
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
