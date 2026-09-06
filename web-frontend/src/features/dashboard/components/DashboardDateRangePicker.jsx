import { Calendar } from 'lucide-react';

export default function DashboardDateRangePicker({
  t,
  from,
  to,
  onFromChange,
  onToChange,
  presets,
  onPreset,
  isPresetActive,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="admin-card flex items-center gap-2 px-3 py-2 !shadow-none">
        <Calendar size={14} className="admin-icon" aria-hidden />
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent text-sm text-[color:var(--admin-text)] focus:outline-none"
        />
        <span className="text-[color:var(--admin-muted)]">—</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent text-sm text-[color:var(--admin-text)] focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onPreset(preset)}
              className={`admin-chip ${active ? 'admin-chip--active' : ''}`}
            >
              {t(`reports.${preset.key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
