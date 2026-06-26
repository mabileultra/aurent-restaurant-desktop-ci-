import '../styles/restaurant-panel.css';

export default function RestaurantPanel({ title, actions, children, flush = false }) {
  return (
    <section className="restaurant-panel">
      {title ? (
        <header className="restaurant-panel__head">
          <h2 className="restaurant-panel__title">{title}</h2>
          {actions ? <div>{actions}</div> : null}
        </header>
      ) : null}
      <div className={`restaurant-panel__body${flush ? ' restaurant-panel__body--flush' : ''}`}>
        {children}
      </div>
    </section>
  );
}
