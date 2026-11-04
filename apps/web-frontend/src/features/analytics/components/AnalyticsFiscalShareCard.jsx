import React from 'react';

const WEEKS = [
  { label: '6–11 okt', share: 93.4 },
  { label: '12–18 okt', share: 91.6 },
  { label: '19–25 okt', share: 95.3 },
  { label: '26 okt–1 noy', share: 98.4 },
  { label: '2–4 noy', share: 98.4 },
];

export default function AnalyticsFiscalShareCard() {
  return (
    <div className="an-card" aria-label="Fiskal va nofiskal aylanma">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Fiskal va nofiskal aylanma</h3>
          <p className="an-card-sub">Ulush va haftalar bo‘yicha o‘zgarish</p>
        </div>
      </div>

      {/* Top Split Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          width: '100%',
          height: 32,
          background: '#f59e0b',
          borderRadius: '0.45rem',
          display: 'flex',
          overflow: 'hidden',
          marginBottom: '0.45rem',
        }}>
          <div
            style={{
              width: '96.5%',
              background: '#2563eb',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '0.75rem',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            96,5%
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>4,24 mlrd fiskal</span>
          <span style={{ color: '#d97706', fontWeight: 600 }}>154,0 mln nofiskal · 3,5%</span>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.65rem' }}>
          <span>Hafta</span>
          <span>Fiskal ulush</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {WEEKS.map((w) => (
            <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '5.5rem', fontSize: '0.78rem', color: '#475569', flexShrink: 0 }}>
                {w.label}
              </span>
              <div style={{ flex: 1, height: 8, background: '#f59e0b', borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${w.share}%`, background: '#2563eb', height: '100%' }} />
              </div>
              <span style={{ width: '3.2rem', textAlign: 'right', fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                {w.share.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Summary Pill */}
      <div style={{
        padding: '0.55rem 0.85rem',
        background: '#f1f5f9',
        borderRadius: '0.55rem',
        fontSize: '0.75rem',
        color: '#475569',
        textAlign: 'center',
        fontWeight: 500,
      }}>
        Fiskal ulush 91,6% dan 98,4% gacha o‘sdi
      </div>
    </div>
  );
}
