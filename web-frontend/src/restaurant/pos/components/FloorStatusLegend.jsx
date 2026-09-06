import { TABLE_STATUSES } from '../utils/tableStatus';
import '../styles/floor-legend.css';

export default function FloorStatusLegend({ t, counts }) {
  return (
    <div className="rst-legend">
      {TABLE_STATUSES.map((status) => (
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
