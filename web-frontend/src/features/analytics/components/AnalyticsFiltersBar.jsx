import React, { useState } from 'react';
import { Bookmark, Filter, RotateCcw, Search } from 'lucide-react';
import PlatformSelect from '../../platform/components/PlatformSelect';

export default function AnalyticsFiltersBar({
  search = '',
  onSearchChange,
  regionCode = '',
  onRegionChange,
  districtCode = '',
  onDistrictChange,
  connectionStatus = '',
  onConnectionStatusChange,
  regions = [],
  districts = [],
  onReset,
  onApply,
  showExtraFilters = false,
  setShowExtraFilters,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = showExtraFilters !== undefined ? showExtraFilters : internalOpen;
  const toggleOpen = () => (setShowExtraFilters ? setShowExtraFilters(!isOpen) : setInternalOpen(!isOpen));

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {/* Search input */}
        <div style={{
          flex: '1 1 220px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.55rem',
          padding: '0 0.65rem',
          height: '2.35rem',
        }}>
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Firma nomi, STIR yoki ID"
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '0.82rem',
              width: '100%',
              background: 'transparent',
            }}
          />
        </div>

        {/* Region Select */}
        <div style={{ minWidth: '150px' }}>
          <PlatformSelect
            value={regionCode}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder="Viloyat: Barchasi"
            options={[
              { value: '', label: 'Viloyat: Barchasi' },
              ...regions.map((r) => ({ value: r.code || r.regionCode, label: r.nameUz || r.nameRu || r.name })),
            ]}
            cleanGeo
          />
        </div>

        {/* District Select if region selected */}
        {districts.length > 0 && (
          <div style={{ minWidth: '150px' }}>
            <PlatformSelect
              value={districtCode}
              onChange={(e) => onDistrictChange(e.target.value)}
              placeholder="Tuman: Barchasi"
              options={[
                { value: '', label: 'Tuman: Barchasi' },
                ...districts.map((d) => ({ value: d.code, label: d.nameUz || d.nameRu || d.name })),
              ]}
              cleanGeo
            />
          </div>
        )}

        {/* Fiscal status select */}
        <div style={{ minWidth: '160px' }}>
          <PlatformSelect
            value={connectionStatus}
            onChange={(e) => onConnectionStatusChange(e.target.value)}
            placeholder="Fiskal holat: Barchasi"
            options={[
              { value: '', label: 'Fiskal holat: Barchasi' },
              { value: 'CONNECTED', label: 'Ulangan' },
              { value: 'NOT_CONNECTED', label: 'Ulanmagan' },
            ]}
          />
        </div>

        {/* Toggle extra filters */}
        <button
          type="button"
          onClick={toggleOpen}
          className={`an-period-btn${isOpen ? ' is-active' : ''}`}
          style={{ height: '2.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Filter size={14} />
          <span>Barcha filtrlar</span>
        </button>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              height: '2.35rem',
              padding: '0 0.75rem',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.55rem',
              cursor: 'pointer',
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
            }}
          >
            <RotateCcw size={13} />
            <span>Tozalash</span>
          </button>
        )}
      </div>
    </div>
  );
}
