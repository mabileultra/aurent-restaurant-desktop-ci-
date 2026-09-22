import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfMonth } from 'date-fns';
import '../styles/report-date-bar.css';

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
    <div className="rst-report-dates">
      <div className="rst-report-dates__range">
        <Calendar size={14} aria-hidden />
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
        <span>—</span>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} />
      </div>
      <div className="rst-report-dates__presets">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`rst-report-dates__chip${isActive(p) ? ' is-active' : ''}`}
            onClick={() => {
              onFrom(p.from());
              onTo(p.to());
            }}
          >
            {t(`reports.${p.key}`, { defaultValue: p.key })}
          </button>
        ))}
      </div>
    </div>
  );
}
