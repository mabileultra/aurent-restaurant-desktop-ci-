import React, { useState } from 'react';
import { ChevronDown, Download, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import PlatformSelect from '../../platform/components/PlatformSelect';

export default function AnalyticsFiltersBar({
  regionCode = '',
  onRegionChange,
  connectionStatus = '',
  onConnectionStatusChange,
  companyType = 'all',
  onCompanyTypeChange,
  activity = 'all',
  onActivityChange,
  search = '',
  onSearchChange,
  regions = [],
  asOfDate = '4-noyabr holatiga',
  onExport,
  onReset,
  showExtraFilters = false,
  setShowExtraFilters,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = showExtraFilters !== undefined ? showExtraFilters : internalOpen;
  const toggleOpen = () => (setShowExtraFilters ? setShowExtraFilters(!isOpen) : setInternalOpen(!isOpen));

  const selectedRegion = regions.find((r) => (r.code || r.regionCode) === regionCode);
  const regionLabel = selectedRegion ? (selectedRegion.nameUz || selectedRegion.name) : 'Respublika';

  const fiscalLabel = connectionStatus === 'CONNECTED'
    ? 'Ulangan'
    : connectionStatus === 'NOT_CONNECTED'
      ? 'Ulanmagan'
      : 'Barchasi';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Primary Canonical Filter Row (Matching Page 1 Design) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="f"
          aria-haspopup="listbox"
          onClick={() => {
            if (regions.length > 0 && onRegionChange) {
              const next = regionCode ? '' : (regions[0]?.code || 'samarkand');
              onRegionChange(next);
            }
          }}
        >
          Hudud: <b>{regionLabel}</b>
          <ChevronDown className="ic" />
        </button>

        <button
          type="button"
          className="f"
          aria-haspopup="listbox"
          onClick={() => onCompanyTypeChange && onCompanyTypeChange(companyType === 'all' ? 'llc' : 'all')}
        >
          Korxona turi: <b>{companyType === 'llc' ? 'MCHJ' : 'Barchasi'}</b>
          <ChevronDown className="ic" />
        </button>

        <button
          type="button"
          className="f"
          aria-haspopup="listbox"
          onClick={() => onActivityChange && onActivityChange(activity === 'all' ? 'retail' : 'all')}
        >
          Faoliyat: <b>{activity === 'retail' ? 'Chakana savdo' : 'Barchasi'}</b>
          <ChevronDown className="ic" />
        </button>

        <button
          type="button"
          className="f"
          aria-haspopup="listbox"
          onClick={() => {
            if (onConnectionStatusChange) {
              const next = connectionStatus === '' ? 'CONNECTED' : connectionStatus === 'CONNECTED' ? 'NOT_CONNECTED' : '';
              onConnectionStatusChange(next);
            }
          }}
        >
          Fiskal holat: <b>{fiscalLabel}</b>
          <ChevronDown className="ic" />
        </button>

        <button
          type="button"
          className="f"
          aria-expanded={isOpen}
          onClick={toggleOpen}
          style={{ color: '#1D4ED8', borderColor: '#C9DAFB', background: '#F5F8FF' }}
        >
          <SlidersHorizontal className="ic" />
          <span>Qo‘shimcha filtrlar</span>
        </button>

        <span style={{ flex: '1 1 auto' }} />

        <span style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>
          Ma’lumot: {asOfDate}
        </span>

        <button
          type="button"
          className="btn"
          onClick={onExport}
        >
          <Download className="ic" style={{ color: '#2563EB' }} />
          <span>Eksport</span>
        </button>
      </div>

      {/* Expandable Extra Filters Drawer */}
      {isOpen && (
        <div className="card" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: '6px', background: '#F9FAFB', border: '1px solid #E5E9EE', borderRadius: 8, padding: '0 10px', height: 34 }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Firma nomi, STIR yoki ID qidirish..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', width: '100%', color: '#1F2937' }}
            />
          </div>

          {regions.length > 0 && (
            <div style={{ minWidth: 180 }}>
              <PlatformSelect
                value={regionCode}
                onChange={(e) => onRegionChange && onRegionChange(e.target.value)}
                placeholder="Hudud: Barchasi"
                options={[
                  { value: '', label: 'Respublika (barchasi)' },
                  ...regions.map((r) => ({ value: r.code || r.regionCode, label: r.nameUz || r.name })),
                ]}
                cleanGeo
              />
            </div>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="btn"
              style={{ color: '#6B7280' }}
            >
              <RotateCcw size={13} />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
