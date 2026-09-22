import { ALL_HALLS_ID } from '../../utils/floorStatusFilters';
import '../styles/cashier-hall-rail.css';

export default function CashierHallRail({
  halls = [],
  selectedHallId,
  onSelectHall,
  t,
}) {
  return (
    <aside className="rst-cashier-halls" aria-label={t('rst.cashier.halls')}>
      <h2 className="rst-cashier-halls__title">{t('rst.cashier.halls')}</h2>
      <button
        type="button"
        className={`rst-cashier-halls__btn${selectedHallId === ALL_HALLS_ID ? ' is-active' : ''}`}
        onClick={() => onSelectHall(ALL_HALLS_ID)}
      >
        {t('rst.floor.allHalls')}
      </button>
      {halls.map((hall) => (
        <button
          key={hall.id}
          type="button"
          className={`rst-cashier-halls__btn${selectedHallId === hall.id ? ' is-active' : ''}`}
          onClick={() => onSelectHall(hall.id)}
        >
          <strong>{hall.name}</strong>
          <span>{(hall.tables ?? []).length}</span>
        </button>
      ))}
    </aside>
  );
}
