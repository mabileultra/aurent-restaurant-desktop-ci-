import '../styles/restaurant-stat-card.css';

export default function RestaurantStatCard({ icon: Icon, value, label, tone = 'emerald' }) {
  return (
    <article className="restaurant-stat-card">
      <div className={`restaurant-stat-card__icon restaurant-stat-card__icon--${tone}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <div className="restaurant-stat-card__value">{value}</div>
        <div className="restaurant-stat-card__label">{label}</div>
      </div>
    </article>
  );
}
