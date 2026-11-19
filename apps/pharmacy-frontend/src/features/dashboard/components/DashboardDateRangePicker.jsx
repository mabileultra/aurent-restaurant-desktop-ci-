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
      <div className="ui-card flex h-10 items-center gap-2 px-3 shadow-none">
        <Calendar size={16} strokeWidth={1.75} className="text-ink-muted" aria-hidden />
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onFromChange(e.target.value)}
          className="ui-tabular bg-transparent text-sm text-ink focus:outline-none"
        />
        <span className="text-ink-muted">—</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onToChange(e.target.value)}
          className="ui-tabular bg-transparent text-sm text-ink focus:outline-none"
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
              className={active ? 'ui-chip ui-chip-active' : 'ui-chip'}
            >
              {t(`reports.${preset.key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
