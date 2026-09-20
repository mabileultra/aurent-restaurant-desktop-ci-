import clsx from 'clsx';
import PageHeader from './PageHeader';

export default function PageLayout({
  title,
  subtitle,
  actions,
  filters,
  children,
  className,
  loose = false,
}) {
  return (
    <section className={clsx('rst-page', loose && 'rst-page--loose', className)}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {filters ? <div className="rst-page__filters">{filters}</div> : null}
      <div className="rst-page__body">{children}</div>
    </section>
  );
}
