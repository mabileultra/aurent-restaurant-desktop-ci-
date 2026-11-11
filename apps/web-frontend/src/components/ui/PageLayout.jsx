import clsx from 'clsx';
import PageHeader from './PageHeader';

export default function PageLayout({
  title,
  subtitle,
  actions,
  filters,
  children,
  className,
  spacing = 'space-y-6',
  meta,
  breadcrumbs,
}) {
  return (
    <div className={clsx(spacing, className)}>
      {(title || subtitle || actions || meta) && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          meta={meta}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
      )}
      {filters}
      {children}
    </div>
  );
}
