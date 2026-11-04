import React, { useMemo, useState } from 'react';
import { fmtMoney } from '../utils/analyticsFormat';

const POINTS = [
  { date: '6-okt', fullDate: '6-oktabr, dushanba', fiscal: 30000000, nonFiscal: 2000000, total: 32000000, avg7: 25000000, topFirm: 'Farina Invest · 40%' },
  { date: '10-okt', fullDate: '10-oktabr, juma', fiscal: 45000000, nonFiscal: 1000000, total: 46000000, avg7: 35000000, topFirm: 'Farina Invest · 50%' },
  { date: '13-okt', fullDate: '13-oktabr, dushanba', fiscal: 20000000, nonFiscal: 1500000, total: 21500000, avg7: 30000000, topFirm: 'Farina Invest · 45%' },
  { date: '17-okt', fullDate: '17-oktabr, juma', fiscal: 60000000, nonFiscal: 2500000, total: 62500000, avg7: 42000000, topFirm: 'Farina Invest · 60%' },
  { date: '20-okt', fullDate: '20-oktabr, dushanba', fiscal: 85000000, nonFiscal: 2000000, total: 87000000, avg7: 70000000, topFirm: 'Farina Invest · 75%' },
  { date: '23-okt', fullDate: '23-oktabr, juma', fiscal: 350000000, nonFiscal: 49400000, total: 399400000, avg7: 150000000, topFirm: 'Farina Invest · 85%' },
  { date: '24-okt', fullDate: '24-oktabr, shanba', fiscal: 1220000000, nonFiscal: 3400000, total: 1223400000, avg7: 229500000, topFirm: 'Farina Invest · 97%' },
  { date: '27-okt', fullDate: '27-oktabr, seshanba', fiscal: 750000000, nonFiscal: 2000000, total: 752000000, avg7: 250000000, topFirm: 'MAKON RBB · 65%' },
  { date: '29-okt', fullDate: '29-oktabr, payshanba', fiscal: 150000000, nonFiscal: 1500000, total: 151500000, avg7: 220000000, topFirm: 'Aminjon XK · 40%' },
  { date: '31-okt', fullDate: '31-oktabr, shanba', fiscal: 450000000, nonFiscal: 3000000, total: 453000000, avg7: 200000000, topFirm: 'Makon Mobile · 50%' },
  { date: '2-noy', fullDate: '2-noyabr, dushanba', fiscal: 90000000, nonFiscal: 1000000, total: 91000000, avg7: 160000000, topFirm: 'Farina Invest · 45%' },
  { date: '4-noy', fullDate: '4-noyabr, chorshanba', fiscal: 180000000, nonFiscal: 2000000, total: 182000000, avg7: 146500000, topFirm: 'Farina Invest · 60%' },
];

export default function AnalyticsTurnoverLineChart({ onSelectDay }) {
  const [hovered, setHovered] = useState(POINTS[6]); // 24-oktabr selected by default as in screenshot

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 60 };
  const maxVal = 1300000000;

  const getX = (idx) => padding.left + (idx / (POINTS.length - 1)) * (width - padding.left - padding.right);
  const getY = (val) => height - padding.bottom - (val / maxVal) * (height - padding.top - padding.bottom);

  const dailyPath = useMemo(() => {
    return POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.total)}`).join(' ');
  }, []);

  const avgPath = useMemo(() => {
    return POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.avg7)}`).join(' ');
  }, []);

  return (
    <div className="an-card" style={{ position: 'relative' }} aria-label="Aylanma dinamikasi grafigi">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Kunlar bo‘yicha aylanma dinamikasi</h3>
          <p className="an-card-sub">Umumiy aylanma, so‘m · nuqta ustiga olib boring, bosilsa kun detali ochiladi</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 2.5, background: '#2563eb', display: 'inline-block' }} />
            <span>Kunlik aylanma</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 2.5, background: '#ea580c', display: 'inline-block' }} />
            <span>7 kunlik o‘rtacha</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Y-axis grid lines */}
          {[0, 250000000, 500000000, 750000000, 1000000000, 1250000000].map((v) => {
            const y = getY(v);
            const label = v === 0 ? '0' : v >= 1000000000 ? `${v / 1000000000} mlrd` : `${v / 1000000} mln`;
            return (
              <g key={v}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{label}</text>
              </g>
            );
          })}

          {/* Paths */}
          <path d={avgPath} fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
          <path d={dailyPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data points */}
          {POINTS.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.total);
            const isSelected = hovered?.date === p.date;
            return (
              <g key={p.date} style={{ cursor: 'pointer' }} onMouseEnter={() => setHovered(p)} onClick={() => onSelectDay && onSelectDay(p)}>
                <circle cx={cx} cy={cy} r={isSelected ? 6 : 4} fill="#ffffff" stroke="#2563eb" strokeWidth={isSelected ? 3 : 2} />
              </g>
            );
          })}

          {/* X axis labels */}
          {['6-okt', '13-okt', '20-okt', '27-okt', '4-noy'].map((dt) => {
            const idx = POINTS.findIndex((pt) => pt.date === dt);
            if (idx === -1) return null;
            return (
              <text key={dt} x={getX(idx)} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {dt}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay (matching Screenshot 1) */}
        {hovered && (
          <div style={{
            position: 'absolute',
            top: 30,
            left: '32%',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '0.65rem',
            padding: '0.75rem 1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '0.78rem',
            minWidth: 200,
            zIndex: 10,
          }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>{hovered.fullDate}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.2rem' }}>
              <span>Fiskal</span>
              <strong style={{ color: '#0f172a' }}>{fmtMoney(hovered.fiscal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '0.35rem' }}>
              <span>Nofiskal</span>
              <strong style={{ color: '#0f172a' }}>{fmtMoney(hovered.nonFiscal)}</strong>
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '0.35rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.35rem' }}>
              <span>Jami</span>
              <span>{fmtMoney(hovered.total)}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
              Eng katta ulush: {hovered.topFirm}
              <br />· 7 kunlik o‘rtacha {fmtMoney(hovered.avg7)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.75rem',
        marginTop: '0.5rem',
        borderTop: '1px solid #f1f5f9',
        fontSize: '0.78rem',
        color: '#475569',
      }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span>Kunlik o‘rtacha <strong>146,5 mln</strong></span>
          <span>Eng yuqori kun <strong>24-okt · 1,22 mlrd</strong></span>
          <span>Savdo bo‘lgan kunlar <strong>28 / 30</strong></span>
        </div>
        <div style={{ color: '#d97706', fontWeight: 500 }}>
          3–4-noyabr: cheklar kelmagan
        </div>
      </div>
    </div>
  );
}
