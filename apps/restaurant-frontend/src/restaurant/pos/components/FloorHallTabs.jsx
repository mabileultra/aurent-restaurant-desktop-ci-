import '../styles/floor-tabs.css';

export default function FloorHallTabs({ halls, selectedHallId, onSelect }) {
  return (
    <div className="rst-floor-tabs">
      {halls.map((hall) => (
        <button
          key={hall.id}
          type="button"
          className={`rst-floor-tabs__btn${selectedHallId === hall.id ? ' is-active' : ''}`}
          onClick={() => onSelect(hall.id)}
        >
          <span className="rst-floor-tabs__name">
            {hall.name}
            {Number(hall.servicePercent) > 0 ? (
              <em className="rst-floor-tabs__fee">{Number(hall.servicePercent)}%</em>
            ) : null}
          </span>
          <span className="rst-floor-tabs__count">{hall.tables?.length ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
