import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfMonth } from 'date-fns';

export default function ReportDateBar({ from, to, onFrom, onTo }) {
  const { t } = useTranslation();
  const presets = [
    { key: 'presetToday', from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset7', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'preset30', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
    { key: 'presetMonth', from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  ];

  const isActive = (p) => from === p.from() && to === p.to();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="admin-card flex items-center gap-2 px-3 py-2 !shadow-none">
        <Calendar size={14} className="admin-icon" aria-hidden />
        <input
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="bg-transparent text-sm text-[color:var(--admin-text)] focus:outline-none"
        />
        <span className="text-[color:var(--admin-muted)]">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="bg-transparent text-sm text-[color:var(--admin-text)] focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              onFrom(p.from());
              onTo(p.to());
            }}
            className={`admin-chip ${isActive(p) ? 'admin-chip--active' : ''}`}
          >
            {t(`reports.${p.key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
