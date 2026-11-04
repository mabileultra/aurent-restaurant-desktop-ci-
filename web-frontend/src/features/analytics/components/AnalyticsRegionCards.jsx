import React from 'react';
import { fmtDeltaBadge, fmtMoney, fmtPercent } from '../utils/analyticsFormat';

export default function AnalyticsRegionCards({
  regions = [],
  selectedRegion,
  onSelectRegion,
}) {
  const activeRegions = regions.filter((r) => Number(r.enterprises || 0) > 0 || Number(r.totalTurnover || 0) > 0);
  const emptyRegions = regions.filter((r) => Number(r.enterprises || 0) === 0 && Number(r.totalTurnover || 0) === 0);

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Active Cards Grid */}
      <section aria-label="Hududlar kartochkalari" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        {activeRegions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
            Hududlar bo‘yicha ma‘lumot yuklanmoqda…
          </div>
        ) : (
          activeRegions.map((r, idx) => {
            const name = r.nameUz || r.nameRu || 'Hududi ko‘rsatilmagan';
            const isSelected = selectedRegion?.code ? selectedRegion.code === r.code : selectedRegion === name || (idx === 0 && !selectedRegion);
            const enterprises = Number(r.enterprises || 0);
            const connected = Number(r.connected || 0);
            const notConnected = Number(r.notConnected || Math.max(0, enterprises - connected));
            const connectedPct = enterprises > 0 ? ((connected / enterprises) * 100).toFixed(1) : '0';
            const delta = fmtDeltaBadge(r.turnoverDeltaPct);
            const isMissing = !r.code || r.code === '0' || name.toLowerCase().includes('ko‘rsatilmagan');
            const rankLabel = isMissing ? 'To‘ldirish kerak' : `${idx + 1}-o‘rin`;
            const badgeClass = isMissing ? 'no' : idx === 0 ? 'info' : 'mute';

            return (
              <div
                key={r.code || name}
                className="card"
                role="button"
                tabIndex={0}
                aria-current={isSelected ? 'true' : 'false'}
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                  borderColor: isSelected ? '#2563EB' : '#E5E9EE',
                  boxShadow: isSelected ? '0 0 0 3px #DCE7FD' : '0 1px 2px rgba(16,24,40,.04)',
                  background: isSelected ? '#F5F8FF' : '#ffffff',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => onSelectRegion && onSelectRegion(r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRegion && onSelectRegion(r);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 650, color: '#1F2937' }}>{name}</span>
                  <span className={`badge ${badgeClass}`}>{rankLabel}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-.02em', color: '#1F2937' }}>
                    {fmtMoney(r.totalTurnover, { showCurrency: false })}
                  </span>
                  <span className={delta.dir} style={{ fontSize: '12.5px' }}>
                    {delta.text}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4B5563' }}>
                    <span>{enterprises} korxona</span>
                    <span>
                      <b style={{ color: '#1D4ED8' }}>{connected}</b> ulangan · <b style={{ color: '#374151' }}>{notConnected}</b> ulanmagan
                    </span>
                  </div>
                  <span role="img" aria-label={`${connected} ulangan, ${notConnected} ulanmagan`} style={{ display: 'flex', gap: '2px', height: '6px' }}>
                    <span style={{ width: `${connectedPct}%`, background: '#2563EB', borderRadius: '3px 0 0 3px' }} />
                    <span style={{ flex: '1 1 auto', background: '#D6DEEA', borderRadius: '0 3px 3px 0' }} />
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F0F2F5', fontSize: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#6B7280' }}>Fiskal</span>
                    <b>{fmtMoney(r.fiscalTurnover, { showCurrency: false })}</b>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#6B7280' }}>Nofiskal</span>
                    <b>{fmtMoney(r.nonFiscalTurnover, { showCurrency: false })}</b>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#6B7280' }}>Fiskal ulush</span>
                    <b>{fmtPercent(r.fiscalSharePct)}</b>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Empty Regions Chips Bar */}
      {emptyRegions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#6B7280' }}>
          <span style={{ fontWeight: 600, color: '#4B5563' }}>Korxonasi yo‘q hududlar ({emptyRegions.length}):</span>
          {emptyRegions.map((r) => (
            <span key={r.code || r.nameUz} className="chip" style={{ height: '26px', fontSize: '12px', padding: '0 8px' }}>
              {r.nameUz || r.nameRu}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
