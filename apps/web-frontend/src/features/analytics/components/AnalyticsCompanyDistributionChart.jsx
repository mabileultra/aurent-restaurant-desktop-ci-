import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const DEFAULT_BUCKETS = [
  { label: '0–20%', count: 10 },
  { label: '20–40%', count: 3 },
  { label: '40–60%', count: 3 },
  { label: '60–80%', count: 1 },
  { label: '80–100%', count: 13 },
];

export default function AnalyticsCompanyDistributionChart({
  buckets = DEFAULT_BUCKETS,
  zeroCount = 10,
  highCount = 13,
  totalSelling = 30,
}) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="an-card" aria-label="Fiskal ulush taqsimoti">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Fiskal ulush bo‘yicha taqsimot</h3>
          <p className="an-card-sub">Savdo qilgan {totalSelling} firma · fiskal aylanma ulushi</p>
        </div>
      </div>

      {/* Histogram Bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 160,
        padding: '1rem 0 0.5rem',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '0.75rem',
      }}>
        {buckets.map((b) => {
          const heightPct = (b.count / maxCount) * 100;
          const isHigh = b.label === '80–100%';
          return (
            <div
              key={b.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                {b.count}
              </span>
              <div
                style={{
                  width: 32,
                  height: `${heightPct}%`,
                  background: isHigh ? '#047857' : '#059669',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Two Highlight Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.65rem',
          background: '#fef3c7',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#92400e',
        }}>
          <AlertCircle size={14} aria-hidden />
          <span><strong>{zeroCount} ta</strong> firmada fiskal chek umuman yo‘q (0%)</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.65rem',
          background: '#ecfdf5',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#065f46',
        }}>
          <CheckCircle2 size={14} aria-hidden />
          <span><strong>{highCount} ta</strong> firmada fiskal ulush 80% dan yuqori</span>
        </div>
      </div>
    </div>
  );
}
