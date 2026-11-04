import React from 'react';
import { ArrowLeftRight, BarChart2, Calendar } from 'lucide-react';
import PlatformDateRangePicker from '../../platform/components/PlatformDateRangePicker';

const PERIOD_KEYS = [
  { key: 'today', label: 'Bugun' },
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: 'month', label: 'Oy' },
  { key: 'quarter', label: 'Chorak' },
  { key: 'year', label: 'Yil' },
];

export default function AnalyticsHeader({
  period = '30d',
  setPeriod,
  customFrom,
  customTo,
  onCustomChange,
  compareLabel = 'Taqqoslash: 6-sen – 5-okt',
  t,
}) {
  return (
    <header className="an-header">
      <div className="an-brand-row">
        <div className="an-brand-icon">
          <BarChart2 size={20} strokeWidth={2.4} aria-hidden />
        </div>
        <div className="an-brand-text">
          <span className="an-brand-sub">Super Admin › Analitika</span>
          <h1 className="an-brand-title">Aurent Analytics</h1>
        </div>
      </div>

      <div className="an-header-bar">
        <div className="an-period-group" role="group" aria-label="Davr tanlash">
          {PERIOD_KEYS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`an-period-btn${period === item.key ? ' is-active' : ''}`}
              onClick={() => setPeriod && setPeriod(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <PlatformDateRangePicker
            from={customFrom}
            to={customTo}
            onChange={onCustomChange}
            placeholder="6-okt – 4-noy, 2026"
            align="right"
            t={t}
          />

          <div className="an-compare-pill">
            <ArrowLeftRight size={13} color="#64748b" aria-hidden />
            <span>{compareLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
