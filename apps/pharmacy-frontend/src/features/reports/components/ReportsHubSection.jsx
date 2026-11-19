import { Link } from 'react-router-dom';

export default function ReportsHubSection({ title, subtitle, links, t }) {
  if (links.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="text-sm text-ink-muted">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map(({ to, key, icon: Icon }) => (
          <Link key={to} to={to} className="admin-hub-card">
            <span className="ui-kpi-icon-primary" aria-hidden>
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 font-semibold text-ink">
              {t(`nav.${key}`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
