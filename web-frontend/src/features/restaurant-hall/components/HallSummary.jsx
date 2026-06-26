import '../styles/hall-summary.css';

export default function HallSummary({ hallName, tableCount, t }) {
  return (
    <div className="hall-summary">
      <div className="hall-summary__main">
        <h2 className="hall-summary__title">{hallName}</h2>
        <span className="hall-summary__badge">{t('restaurantHall.activeBadge')}</span>
      </div>
      <span className="hall-summary__count">{t('restaurantHall.tablesCount', { count: tableCount })}</span>
    </div>
  );
}
