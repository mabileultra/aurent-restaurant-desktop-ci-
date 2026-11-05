import React, { useMemo, useState } from 'react';
import { Download, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import PlatformSelect from '../../platform/components/PlatformSelect';
import { sanitizeText } from '../utils/analyticsFormat';

const COMPANY_TYPE_OPTIONS = [
  { value: 'all', label: 'Korxona: Barchasi' },
  { value: 'llc', label: 'MCHJ' },
  { value: 'pe', label: 'XK / Xususiy' },
  { value: 'ie', label: 'YaTT' },
];

const ACTIVITY_OPTIONS = [
  { value: 'all', label: 'Faoliyat: Barchasi' },
  { value: 'retail', label: 'Chakana savdo' },
  { value: 'restaurant', label: 'Umumiy ovqatlanish' },
  { value: 'pharmacy', label: 'Dorixona' },
];

const FISCAL_STATUS_OPTIONS = [
  { value: '', label: 'Fiskal: Barchasi' },
  { value: 'CONNECTED', label: 'Ulangan' },
  { value: 'NOT_CONNECTED', label: 'Ulanmagan' },
];

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
  asOfDate = 'Bugungi holatda',
  onExport,
  onReset,
  showExtraFilters = false,
  setShowExtraFilters,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof setShowExtraFilters === 'function';
  const isOpen = isControlled ? Boolean(showExtraFilters) : internalOpen;
  const toggleOpen = () => (isControlled ? setShowExtraFilters(!isOpen) : setInternalOpen((prev) => !prev));

  const regionOptions = useMemo(() => [
    { value: '', label: 'Hudud: Respublika' },
    ...regions.map((r) => ({
      value: r.code || r.regionCode,
      label: sanitizeText(r.nameUz || r.name),
    })),
  ], [regions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
      {/* Primary Filter Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Real Region Selector */}
        <PlatformSelect
          value={regionCode}
          onChange={(e) => onRegionChange && onRegionChange(e.target.value)}
          options={regionOptions}
          size="sm"
          theme="blue"
          searchable
          style={{ width: 'auto', minWidth: 160, maxWidth: 210 }}
          ariaLabel="Hudud tanlash"
        />

        {/* Real Company Type Selector */}
        <PlatformSelect
          value={companyType}
          onChange={(e) => onCompanyTypeChange && onCompanyTypeChange(e.target.value)}
          options={COMPANY_TYPE_OPTIONS}
          size="sm"
          theme="blue"
          searchable={false}
          style={{ width: 'auto', minWidth: 140 }}
          ariaLabel="Korxona turi"
        />

        {/* Real Activity Selector */}
        <PlatformSelect
          value={activity}
          onChange={(e) => onActivityChange && onActivityChange(e.target.value)}
          options={ACTIVITY_OPTIONS}
          size="sm"
          theme="blue"
          searchable={false}
          style={{ width: 'auto', minWidth: 140 }}
          ariaLabel="Faoliyat turi"
        />

        {/* Real Connection Status Selector */}
        <PlatformSelect
          value={connectionStatus}
          onChange={(e) => onConnectionStatusChange && onConnectionStatusChange(e.target.value)}
          options={FISCAL_STATUS_OPTIONS}
          size="sm"
          theme="blue"
          searchable={false}
          style={{ width: 'auto', minWidth: 135 }}
          ariaLabel="Fiskal holati"
        />

        <button
          type="button"
          className="f"
          aria-expanded={isOpen}
          onClick={toggleOpen}
          style={{ color: '#1D4ED8', borderColor: '#C9DAFB', background: '#F5F8FF' }}
        >
          <SlidersHorizontal className="ic" />
          <span>Qidiruv</span>
        </button>

        <span style={{ flex: '1 1 auto' }} />

        <span style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>
          {asOfDate}
        </span>

        {onExport && (
          <button
            type="button"
            className="btn"
            onClick={onExport}
          >
            <Download className="ic" style={{ color: '#2563EB' }} />
            <span>Eksport</span>
          </button>
        )}
      </div>

      {/* Expandable Search Drawer */}
      {isOpen && (
        <div className="card" style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '8px', background: '#F9FAFB', border: '1px solid #E5E9EE', borderRadius: 8, padding: '0 10px', height: 34 }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Firma nomi yoki STIR bo‘yicha qidirish..."
              style={{ border: 0, outline: 0, background: 'transparent', fontSize: '12.5px', width: '100%', color: '#1F2937', boxShadow: 'none' }}
            />
          </div>

          {onReset && (
            <button
              type="button"
              className="btn"
              onClick={onReset}
              style={{ color: '#6B7280', height: 34 }}
            >
              <RotateCcw size={13} />
              Filtrlarni tozalash
            </button>
          )}
        </div>
      )}
    </div>
  );
}
