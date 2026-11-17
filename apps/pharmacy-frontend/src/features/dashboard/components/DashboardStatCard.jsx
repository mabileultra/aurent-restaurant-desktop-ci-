const TILE = {
  emerald: 'ui-kpi-icon-primary',
  blue: 'ui-kpi-icon-primary',
  amber: 'ui-kpi-icon-warning',
  red: 'ui-kpi-icon-danger',
};

export default function DashboardStatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  return (
    <div className="ui-kpi-card">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="ui-tabular mt-1 text-2xl font-bold text-ink">{value}</p>
        {sub ? <p className="mt-1 text-xs text-ink-muted">{sub}</p> : null}
      </div>
      <div className={TILE[color] ?? TILE.emerald} aria-hidden>
        <Icon size={20} strokeWidth={1.75} />
      </div>
    </div>
  );
}
