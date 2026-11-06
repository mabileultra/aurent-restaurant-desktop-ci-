import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AnalyticsCompanyDistributionChart({
  buckets = [],
  zeroCount = 0,
  highCount = 0,
  totalSelling = 0,
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
                  background: isHigh ? '#2563EB' : '#93C5FD',
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
          background: '#FEF3C7',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#92400E',
        }}>
          <AlertCircle size={14} aria-hidden />
          <span><strong>{zeroCount} ta</strong> firmada fiskal chek umuman yo‘q (0%)</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.65rem',
          background: '#EFF6FF',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#1D4ED8',
        }}>
          <CheckCircle2 size={14} aria-hidden />
          <span><strong>{highCount} ta</strong> firmada fiskal ulush 80% dan yuqori</span>
        </div>
      </div>
    </div>
  );
}
