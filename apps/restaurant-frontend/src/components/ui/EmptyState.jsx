export default function EmptyState({ title, text, actions }) {
  return (
    <div className="base-empty">
      {title ? <h2 className="base-empty__title">{title}</h2> : null}
      {text ? <p className="base-empty__text">{text}</p> : null}
      {actions ? <div className="base-empty__actions">{actions}</div> : null}
    </div>
  );
}
