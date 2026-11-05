import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnalyticsTabs from './AnalyticsTabs';
import PlatformDateRangePicker from '../../platform/components/PlatformDateRangePicker';
import { useAnalyticsPeriodStore } from '../hooks/useAnalyticsPeriodStore';

const PERIOD_KEYS = [
  { key: 'today', label: 'Bugun' },
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: 'month', label: 'Oy' },
  { key: 'quarter', label: 'Chorak' },
  { key: 'year', label: 'Yil' },
];

export default function AnalyticsHeader({
  period,
  setPeriod,
  customFrom,
  customTo,
  onCustomChange,
  compareLabel,
  t,
}) {
  const storePeriod = useAnalyticsPeriodStore((s) => s.period);
  const setStorePeriod = useAnalyticsPeriodStore((s) => s.setPeriod);
  const storeCustomFrom = useAnalyticsPeriodStore((s) => s.customFrom);
  const storeCustomTo = useAnalyticsPeriodStore((s) => s.customTo);
  const setCustomRange = useAnalyticsPeriodStore((s) => s.setCustomRange);
  const labels = useAnalyticsPeriodStore((s) => s.getLabels());

  const activePeriod = period || storePeriod;
  const activeSetPeriod = setPeriod || setStorePeriod;
  const activeFrom = customFrom !== undefined ? customFrom : storeCustomFrom;
  const activeTo = customTo !== undefined ? customTo : storeCustomTo;
  const activeCustomChange = onCustomChange || setCustomRange;
  const activeCompareLabel = compareLabel || labels.compareLabel;

  return (
    <header className="an-header-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        {/* Brand with h1 accessibility */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: '#2563EB',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg className="ic" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <path d="M5 20V11M11 20V5M17 20v-7" />
            </svg>
          </span>
          <div>
            <div style={{ fontSize: '11.5px', color: '#6B7280' }}>Super Admin › Analitika</div>
            <h1 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-.01em', color: '#1F2937', margin: 0 }}>
              Aurent Analytics
            </h1>
          </div>
        </div>

        {/* Controls: Segmented + DatePicker + Compare */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="seg" role="group" aria-label="Davr">
            {PERIOD_KEYS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={activePeriod === item.key ? 'on' : ''}
                aria-pressed={activePeriod === item.key}
                onClick={() => activeSetPeriod(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <PlatformDateRangePicker
            from={activeFrom}
            to={activeTo}
            onChange={activeCustomChange}
            placeholder={labels.currentLabel}
            align="right"
            theme="blue"
            maxDate={new Date().toISOString().split('T')[0]}
            t={t}
          />

          <Link to="/platform/analytics/comparison" className="btn" style={{ color: '#4B5563', textDecoration: 'none' }}>
            <ArrowLeftRight className="ic" style={{ width: 14, height: 14 }} aria-hidden />
            <span>{activeCompareLabel}</span>
          </Link>
        </div>
      </div>

      <AnalyticsTabs />
    </header>
  );
}
