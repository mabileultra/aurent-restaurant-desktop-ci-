import ReadyDisplayNumber from './ReadyDisplayNumber';

export default function ReadyDisplayColumn({
  title,
  subtitle,
  orders,
  variant,
  emptyLabel,
  freshKeys,
}) {
  return (
    <section className={`rst-rdy-col rst-rdy-col--${variant}`} aria-label={title}>
      <header className="rst-rdy-col__head">
        <h2 className="rst-rdy-col__title">{title}</h2>
        {subtitle ? <p className="rst-rdy-col__sub">{subtitle}</p> : null}
        <span className="rst-rdy-col__count">{orders.length}</span>
      </header>
      {orders.length === 0 ? (
        <p className="rst-rdy-col__empty">{emptyLabel}</p>
      ) : (
        <ul className="rst-rdy-col__list">
          {orders.map((order) => (
            <ReadyDisplayNumber
              key={order.key}
              order={order}
              highlight={variant === 'ready' && freshKeys?.has(order.key)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
