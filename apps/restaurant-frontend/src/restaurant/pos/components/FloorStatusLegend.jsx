import { TABLE_STATUSES } from '../utils/tableStatus';
import '../styles/floor-legend.css';

export default function FloorStatusLegend({ t, counts, statuses }) {
  const list = statuses?.length ? statuses : TABLE_STATUSES;
  return (
    <div className="rst-legend">
      {list.map((status) => (
        <span key={status} className="rst-legend__item">
          <span className={`rst-legend__dot rst-legend__dot--${status}`} />
          {t(`rst.status.${status}`)}
          {counts ? (
            <strong className="rst-legend__count">{counts[status] ?? 0}</strong>
          ) : null}
        </span>
      ))}
    </div>
  );
}
