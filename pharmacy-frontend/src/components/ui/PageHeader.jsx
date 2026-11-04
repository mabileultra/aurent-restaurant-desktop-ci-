export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {title && (
          <h1 className="admin-page-title text-xl">{title}</h1>
        )}
        {subtitle && (
          <p className="admin-page-subtitle text-sm">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
