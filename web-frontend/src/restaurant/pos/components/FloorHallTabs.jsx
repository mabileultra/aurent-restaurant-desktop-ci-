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
          {hall.name}
        </button>
      ))}
    </div>
  );
}
