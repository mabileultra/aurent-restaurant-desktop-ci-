import React, { useMemo, useRef, useState } from 'react';
import { fmtDayShort, fmtMoney } from '../utils/analyticsFormat';
import { calculateDailyMetrics } from '../utils/analyticsCalculations';
import {
  buildChartPoints,
  calculateChartNiceScale,
  calculateCrosshairIndex,
} from '../utils/analyticsChartMath';
import AnalyticsTurnoverTooltip from './AnalyticsTurnoverTooltip';

export default function AnalyticsTurnoverLineChart({
  days = [],
  topCompanyName = '',
  onSelectDay,
}) {
  const svgRef = useRef(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const points = useMemo(() => buildChartPoints(days, topCompanyName), [days, topCompanyName]);
  const metrics = useMemo(() => calculateDailyMetrics(days), [days]);

  const width = 800;
  const height = 245;
  const pad = { top: 20, right: 24, bottom: 32, left: 68 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const rawMax = useMemo(() => {
    if (points.length === 0) return 1000000;
    return Math.max(...points.map((p) => Math.max(p.total, p.avg7)), 1);
  }, [points]);

  const { maxVal, ticks: yTicks } = useMemo(() => calculateChartNiceScale(rawMax, 5), [rawMax]);

  const getX = (idx) => pad.left + (idx / Math.max(points.length - 1, 1)) * chartW;
  const getY = (val) => height - pad.bottom - (val / maxVal) * chartH;

  const dailyPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.total)}`).join(' ');
  }, [points, maxVal]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const lastX = getX(points.length - 1);
    const firstX = getX(0);
    const bottomY = height - pad.bottom;
    return `${dailyPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [dailyPath, points]);

  const avgPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.avg7)}`).join(' ');
  }, [points, maxVal]);

  const xTickIndices = useMemo(() => {
    const len = points.length;
    if (len <= 5) return points.map((_, i) => i);
    return [0, Math.round(len * 0.24), Math.round(len * 0.48), Math.round(len * 0.72), len - 1];
  }, [points]);

  const isHovered = hoveredIdx !== null;
  const activePoint = isHovered && points[hoveredIdx] ? points[hoveredIdx] : null;
  const activeX = isHovered ? getX(hoveredIdx) : 0;
  const activeY = activePoint ? getY(activePoint.total) : 0;
  const activeYAvg = activePoint ? getY(activePoint.avg7) : 0;
  const isRightHalf = hoveredIdx !== null && hoveredIdx >= points.length / 2;

  const handlePointerMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (clientX == null) return;
    const svgScale = rect.width / width;
    const svgMouseX = (clientX - rect.left) / svgScale;
    const idx = calculateCrosshairIndex(svgMouseX, pad.left, chartW, points.length);
    setHoveredIdx(idx);
  };

  return (
    <section className="card an-card" aria-labelledby="dyn" style={{ flex: '2 1 620px', minWidth: 0, minHeight: '340px', padding: '20px 24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 id="dyn" className="t" style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Kunlar bo‘yicha aylanma dinamikasi</h2>
            <span style={{ fontSize: '11px', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>8 ta yirik korxona bo‘yicha</span>
          </div>
          <p className="s" style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
            Umumiy aylanma, so‘m · 8 ta yirik korxona bo‘yicha · nuqta ustiga olib boring, bosilsa kun detali ochiladi
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: '#475569', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 16, height: 3, borderRadius: 2, background: '#2563EB' }} />
            Kunlik aylanma
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 16, height: 3, borderRadius: 2, background: '#EA580C' }} />
            7 kunlik o‘rtacha
          </span>
        </div>
      </div>

      <div className="an-turnover-chart-wrap" onMouseLeave={() => setHoveredIdx(null)}>
        {points.length === 0 ? (
          <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>
            Tanlangan davr uchun dinamika ma‘lumoti mavjud emas
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="an-chart-svg"
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onTouchEnd={() => setHoveredIdx(null)}
            onClick={() => activePoint && onSelectDay && onSelectDay(activePoint)}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="an-turnover-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {yTicks.map((v, i) => {
              const y = getY(v);
              const label = fmtMoney(v, { showCurrency: false });
              return (
                <g key={i}>
                  <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                  <text x={pad.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#94A3B8">{label}</text>
                </g>
              );
            })}

            <path d={areaPath} fill="url(#an-turnover-area-grad)" />
            <path d={avgPath} fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={dailyPath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {isHovered && activePoint && (
              <g pointerEvents="none">
                <line x1={activeX} y1={pad.top} x2={activeX} y2={height - pad.bottom} className="an-crosshair-line" />
                <circle cx={activeX} cy={activeY} r={8} fill="#2563EB" fillOpacity="0.2" className="an-pulse-ring" />
                <circle cx={activeX} cy={activeY} r={5} fill="#2563EB" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx={activeX} cy={activeYAvg} r={4} fill="#EA580C" stroke="#ffffff" strokeWidth="2" />
              </g>
            )}

            {xTickIndices.map((idx) => {
              const pt = points[idx];
              if (!pt) return null;
              return (
                <text key={pt.rawDate} x={getX(idx)} y={height - 8} textAnchor="middle" fontSize="11" fill="#94A3B8">
                  {pt.date}
                </text>
              );
            })}
          </svg>
        )}

        {isHovered && activePoint && (
          <AnalyticsTurnoverTooltip
            point={activePoint}
            leftPct={(activeX / width) * 100}
            isRightHalf={isRightHalf}
            isVisible={true}
          />
        )}
      </div>

      <div className="an-turnover-summary-bar">
        <span>Kunlik o‘rtacha <b>{fmtMoney(metrics.avgDaily, { showCurrency: false })}</b></span>
        <span>Eng yuqori kun <b>{metrics.peakDay ? `${fmtDayShort(metrics.peakDay.date)} · ${fmtMoney(metrics.peakDay.amount, { showCurrency: false })}` : '—'}</b></span>
        <span>Savdo bo‘lgan kunlar <b>{metrics.activeDays} / {metrics.totalDays || points.length}</b></span>
        <span style={{ color: '#2563EB', fontWeight: 600 }}>
          8 ta yirik korxona dinamikasi
        </span>
      </div>
    </section>
  );
}
