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
      <div className="inline-flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-3">
        <Calendar size={15} strokeWidth={1.75} className="text-primary-600 shrink-0" aria-hidden />
        <input
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="bg-transparent text-sm text-ink ui-tabular focus:outline-none"
        />
        <span className="text-ink-muted">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="bg-transparent text-sm text-ink ui-tabular focus:outline-none"
        />
      </div>
      <div className="ui-tabs flex-wrap">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              onFrom(p.from());
              onTo(p.to());
            }}
            className={`ui-tab ${isActive(p) ? 'ui-tab-active' : ''}`}
          >
            {t(`reports.${p.key}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
