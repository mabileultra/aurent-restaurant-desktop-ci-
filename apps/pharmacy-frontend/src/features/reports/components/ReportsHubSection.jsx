import { Link } from 'react-router-dom';

export default function ReportsHubSection({ title, subtitle, links, t }) {
  if (links.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="admin-page-title text-base">{title}</h2>
        <p className="admin-page-subtitle text-sm">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map(({ to, key, icon: Icon }) => (
          <Link key={to} to={to} className="admin-hub-card">
            <span className="admin-icon-tile" aria-hidden>
              <Icon size={20} strokeWidth={2} />
            </span>
            <span className="min-w-0 font-semibold text-[color:var(--admin-ink)] dark:text-white">
              {t(`nav.${key}`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
