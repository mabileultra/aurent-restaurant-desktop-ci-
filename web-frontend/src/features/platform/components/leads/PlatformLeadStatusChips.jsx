export default function PlatformLeadStatusChips({
  t,
  statusOptions,
  status,
  onStatusChange,
}) {
  return (
    <div className="platform-status-chips inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-700">
      {statusOptions.map((value) => (
        <button
          key={value || 'all'}
          type="button"
          onClick={() => onStatusChange(value)}
          className={`rounded px-3 py-1 font-medium transition-colors ${
            status === value ? 'admin-chip admin-chip--active' : 'admin-chip'
          }`}
        >
          {value ? t(`platform.leads.statuses.${value}`) : t('platform.leads.filterAll')}
        </button>
      ))}
    </div>
  );
}
