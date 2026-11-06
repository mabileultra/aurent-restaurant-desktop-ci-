const TILE = {
  emerald: 'admin-icon-tile',
  blue: 'admin-icon-tile',
  amber: 'admin-icon-tile admin-icon-tile--amber',
  red: 'admin-icon-tile admin-icon-tile--red',
};

export default function DashboardStatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="admin-page-subtitle text-sm">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[color:var(--admin-ink)] dark:text-white">{value}</p>
          {sub ? <p className="mt-1 text-xs text-[color:var(--admin-muted)]">{sub}</p> : null}
        </div>
        <div className={TILE[color] ?? TILE.emerald} aria-hidden>
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
