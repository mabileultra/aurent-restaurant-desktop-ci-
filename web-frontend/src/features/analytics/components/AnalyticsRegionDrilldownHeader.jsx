import React from 'react';
import { ArrowUpDown, Download, ChevronRight } from 'lucide-react';

export default function AnalyticsRegionDrilldownHeader({
  activeView = 'cards',
  setActiveView,
  selectedRegion = 'Samarqand viloyati',
  onSelectCountry,
  onCompare,
  onExport,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {/* Breadcrumbs */}
      <nav aria-label="Detalizatsiya yo‘li" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', flexWrap: 'wrap' }}>
        <button
          type="button"
          style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'none', color: '#2563EB', fontWeight: 500, cursor: 'pointer' }}
          onClick={onSelectCountry}
        >
          Respublika
        </button>
        <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
        <span style={{ fontWeight: 650, color: '#1F2937' }}>{selectedRegion}</span>
        <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
        <span style={{ color: '#6B7280' }}>Tuman</span>
        <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
        <span style={{ color: '#9CA3AF' }}>Korxona</span>
        <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
        <span style={{ color: '#9CA3AF' }}>Do‘kon</span>
      </nav>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div className="seg" role="group" aria-label="Ko‘rinish">
          <button
            type="button"
            className={activeView === 'cards' ? 'on' : ''}
            aria-pressed={activeView === 'cards'}
            onClick={() => setActiveView && setActiveView('cards')}
          >
            Kartochkalar
          </button>
          <button
            type="button"
            className={activeView === 'table' ? 'on' : ''}
            aria-pressed={activeView === 'table'}
            onClick={() => setActiveView && setActiveView('table')}
          >
            Jadval
          </button>
        </div>

        <button type="button" className="f">
          Saralash: <b>Aylanma ↓</b>
        </button>

        <button type="button" className="f">
          Fiskal holat: <b>Barchasi</b>
        </button>

        <button type="button" className="btn" onClick={onCompare}>
          <ArrowUpDown size={14} style={{ color: '#2563EB' }} />
          <span>Hududlarni solishtirish</span>
        </button>

        <button type="button" className="btn" onClick={onExport}>
          <Download size={14} style={{ color: '#2563EB' }} />
          <span>Excel</span>
        </button>
      </div>
    </div>
  );
}
