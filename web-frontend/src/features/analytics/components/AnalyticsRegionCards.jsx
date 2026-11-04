import React from 'react';

const EMPTY_REGIONS = [
  'Qoraqalpog‘iston', 'Andijon', 'Buxoro', 'Jizzax', 'Qashqadaryo',
  'Navoiy', 'Namangan', 'Surxondaryo', 'Sirdaryo', 'Farg‘ona', 'Xorazm',
];

const REGIONS = [
  {
    name: 'Samarqand viloyati',
    rank: '1-o‘rin',
    badgeClass: 'info',
    turnover: '4,19 mlrd',
    prev: '514,5 mln',
    diff: '+3,68 mlrd',
    growth: '↑ 714,5%',
    enterprises: 63,
    connected: 16,
    fiscal: '4,09 mlrd',
    nonFiscal: '99,1 mln',
    fiscalShare: '97,6%',
  },
  {
    name: 'Hududi ko‘rsatilmagan',
    rank: 'To‘ldirish kerak',
    badgeClass: 'no',
    turnover: '205,2 mln',
    prev: '84,8 mln',
    diff: '+120,4 mln',
    growth: '↑ 142,0%',
    enterprises: 49,
    connected: 15,
    fiscal: '150,3 mln',
    nonFiscal: '54,9 mln',
    fiscalShare: '73,3%',
  },
  {
    name: 'Toshkent viloyati',
    rank: '3-o‘rin',
    badgeClass: 'mute',
    turnover: '0',
    prev: '0',
    diff: '0',
    growth: '—',
    enterprises: 1,
    connected: 1,
    fiscal: '0',
    nonFiscal: '0',
    fiscalShare: '—',
  },
  {
    name: 'Toshkent shahri',
    rank: '4-o‘rin',
    badgeClass: 'mute',
    turnover: '0',
    prev: '0',
    diff: '0',
    growth: '—',
    enterprises: 1,
    connected: 0,
    fiscal: '0',
    nonFiscal: '0',
    fiscalShare: '—',
  },
];

export default function AnalyticsRegionCards({ selectedRegion = 'Samarqand viloyati', onSelectRegion }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 4 Cards Grid */}
      <section aria-label="Hududlar kartochkalari" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        {REGIONS.map((r) => {
          const isSelected = selectedRegion === r.name;
          const notConnected = r.enterprises - r.connected;
          const connectedPct = ((r.connected / r.enterprises) * 100).toFixed(1);

          return (
            <div
              key={r.name}
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
              onClick={() => onSelectRegion && onSelectRegion(r.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRegion && onSelectRegion(r.name);
                }
              }}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 650, color: '#1F2937' }}>{r.name}</span>
                <span className={`badge ${r.badgeClass}`}>{r.rank}</span>
              </span>

              <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-.02em', color: '#1F2937' }}>{r.turnover}</span>
                {r.growth !== '—' ? (
                  <span className="up" style={{ fontSize: '12.5px' }}>{r.growth}</span>
                ) : (
                  <span style={{ fontSize: '12.5px', color: '#9CA3AF' }}>—</span>
                )}
              </span>

              <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '-6px' }}>
                O‘tgan davr: {r.prev} · farq {r.diff}
              </span>

              <span style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4B5563' }}>
                  <span>{r.enterprises} korxona</span>
                  <span>
                    <b style={{ color: '#1D4ED8' }}>{r.connected}</b> ulangan · <b style={{ color: '#374151' }}>{notConnected}</b> ulanmagan
                  </span>
                </span>
                <span role="img" aria-label={`${r.connected} ulangan, ${notConnected} ulanmagan`} style={{ display: 'flex', gap: '2px', height: '6px' }}>
                  <span style={{ width: `${connectedPct}%`, background: '#2563EB', borderRadius: '3px 0 0 3px' }} />
                  <span style={{ flex: '1 1 auto', background: '#D6DEEA', borderRadius: '0 3px 3px 0' }} />
                </span>
              </span>

              <span style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F0F2F5', fontSize: '12px' }}>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#6B7280' }}>Fiskal</span>
                  <b>{r.fiscal}</b>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#6B7280' }}>Nofiskal</span>
                  <b>{r.nonFiscal}</b>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#6B7280' }}>Fiskal ulush</span>
                  <b>{r.fiscalShare}</b>
                </span>
              </span>
            </div>
          );
        })}
      </section>

      {/* Empty Regions Chips Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#6B7280' }}>
        <span style={{ fontWeight: 600, color: '#4B5563' }}>Korxonasi yo‘q hududlar (11):</span>
        {EMPTY_REGIONS.map((r) => (
          <span key={r} className="chip" style={{ height: '26px', fontSize: '12px', padding: '0 8px' }}>
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
