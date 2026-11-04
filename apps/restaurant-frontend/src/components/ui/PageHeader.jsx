import clsx from 'clsx';

export default function PageHeader({ title, subtitle, actions }) {
  if (!title && !subtitle && !actions) return null;

  return (
    <header className="rst-page__header">
      <div className="rst-page__title-block">
        {title ? <h1 className="rst-page__title">{title}</h1> : null}
        {subtitle ? <p className="rst-page__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="rst-page__actions">{actions}</div> : null}
    </header>
  );
}
