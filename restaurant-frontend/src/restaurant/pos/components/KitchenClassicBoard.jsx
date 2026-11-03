import KitchenTicketCard from './KitchenTicketCard';
import { KDS_COLUMNS } from '../utils/kitchenBoard';

export default function KitchenClassicBoard({
  columns,
  visibleColumns,
  mobile,
  mobileStatus,
  setMobileStatus,
  now,
  waiterNameById,
  canAdvance,
  advancing,
  onAdvance,
  t,
}) {
  return (
    <>
      {mobile.enabled ? (
        <div className="rst-kitchen-mobile-tabs" role="tablist" aria-label={t('rst.kitchen.columns')}>
          {KDS_COLUMNS.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={mobileStatus === status}
              className={`rst-kitchen-mobile-tabs__btn${mobileStatus === status ? ' is-active' : ''}`}
              onClick={() => setMobileStatus(status)}
            >
              <span>{t(`rst.kitchen.status.${status}`)}</span>
              <em>{(columns[status] || []).length}</em>
            </button>
          ))}
        </div>
      ) : null}

      <div className="rst-kds">
        {visibleColumns.map((status, index) => (
          <section key={status} className={`rst-kds__col rst-kds__col--${status}`}>
            <h2 className="rst-kds__col-title">
              <span className="rst-kds__col-dot" aria-hidden />
              {t(`rst.kitchen.status.${status}`)}
              <span className="rst-kds__col-count">{columns[status].length}</span>
              {mobile.enabled ? null : (
                <span className="rst-kds__col-hotkey">[{index + 1}]</span>
              )}
            </h2>
            <div className="rst-kds__cards">
              {(columns[status] || []).map((ticket) => (
                <KitchenTicketCard
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
    </>
  );
}
