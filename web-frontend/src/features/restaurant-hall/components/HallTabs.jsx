import { Pencil, Trash2 } from 'lucide-react';
import '../styles/hall-tabs.css';

export default function HallTabs({
  halls,
  selectedHallId,
  onSelectHall,
  onEditHall,
  onDeleteHall,
}) {
  return (
    <div className="hall-tabs">
      {halls.map((hall) => (
        <button
          key={hall.id}
          type="button"
          className={`hall-tabs__item${selectedHallId === hall.id ? ' hall-tabs__item--active' : ''}`}
          onClick={() => onSelectHall(hall.id)}
        >
          {hall.name}
        </button>
      ))}
      {selectedHallId ? (
        <>
          <button type="button" className="hall-tabs__action" onClick={onEditHall} aria-label="edit">
            <Pencil size={14} />
          </button>
          <button type="button" className="hall-tabs__action" onClick={onDeleteHall} aria-label="delete">
            <Trash2 size={14} />
          </button>
        </>
      ) : null}
    </div>
  );
}
