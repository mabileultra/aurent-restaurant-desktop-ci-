import React, { useState } from 'react';

const REGION_TILES = [
  { code: '1735', shortName: 'Qoraqalp.', name: 'Qoraqalpog‘iston', count: 0 },
  { code: '1727', shortName: 'Tosh. vil.', name: 'Toshkent viloyati', count: 1, connected: 1 },
  { code: '1733', shortName: 'Xorazm', name: 'Xorazm', count: 0 },
  { code: '1712', shortName: 'Navoiy', name: 'Navoiy', count: 0 },
  { code: '1708', shortName: 'Jizzax', name: 'Jizzax', count: 0 },
  { code: '1724', shortName: 'Sirdaryo', name: 'Sirdaryo', count: 0 },
  { code: '1726', shortName: 'Toshkent sh.', name: 'Toshkent shahri', count: 1, connected: 0 },
  { code: '1714', shortName: 'Namangan', name: 'Namangan', count: 0 },
  { code: '1703', shortName: 'Andijon', name: 'Andijon', count: 0 },
  { code: '1706', shortName: 'Buxoro', name: 'Buxoro', count: 0 },
  { code: '1718', shortName: 'Samarqand', name: 'Samarqand viloyati', count: 63, connected: 16 },
  { code: '1730', shortName: 'Farg‘ona', name: 'Farg‘ona', count: 0 },
  { code: '1710', shortName: 'Qashqad.', name: 'Qashqadaryo', count: 0 },
  { code: '1722', shortName: 'Surxond.', name: 'Surxondaryo', count: 0 },
];

function getHeatClass(count) {
  if (count <= 0) return 'an-heat-0';
  if (count <= 5) return 'an-heat-1';
  if (count <= 20) return 'an-heat-2';
  if (count <= 50) return 'an-heat-3';
  return 'an-heat-4';
}

export default function AnalyticsUzbekistanMap({ selectedRegionCode, onSelectRegion }) {
  const [metricTab, setMetricTab] = useState('enterprises'); // 'enterprises' | 'turnover' | 'connected'

  return (
    <div className="an-card" aria-label="Viloyatlar kesimida">
      <div className="an-card-head">
        <div>
          <h3 className="an-card-title">Viloyatlar kesimida</h3>
          <p className="an-card-sub">
            Korxonalar soni bo‘yicha · xarita hududlarning taxminiy joylashuvini ko‘rsatadi
          </p>
        </div>

        <div className="an-period-group">
          <button
            type="button"
            className={`an-period-btn${metricTab === 'enterprises' ? ' is-active' : ''}`}
            onClick={() => setMetricTab('enterprises')}
          >
            Korxonalar
          </button>
          <button
            type="button"
            className={`an-period-btn${metricTab === 'turnover' ? ' is-active' : ''}`}
            onClick={() => setMetricTab('turnover')}
          >
            Aylanma
          </button>
          <button
            type="button"
            className={`an-period-btn${metricTab === 'connected' ? ' is-active' : ''}`}
            onClick={() => setMetricTab('connected')}
          >
            Fiskal ulanish
          </button>
        </div>
      </div>

      <div className="an-map-layout">
        {/* Schematic Cardogram Map */}
        <div>
          <div className="an-map-grid">
            {REGION_TILES.map((r) => {
              const isActive = selectedRegionCode === r.code;
              const heat = getHeatClass(r.count);
              return (
                <div
                  key={r.code}
                  className={`an-map-tile ${heat}${isActive ? ' is-active' : ''}`}
                  onClick={() => onSelectRegion && onSelectRegion(isActive ? null : r.code)}
                  title={`${r.name}: ${r.count} ta korxona`}
                >
                  <div className="an-map-tile-name">{r.shortName}</div>
                  <div className="an-map-tile-count">{r.count}</div>
                </div>
              );
            })}
          </div>

          {/* Heatmap Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: '#64748b', marginTop: '0.75rem' }}>
            <span>Korxona yo‘q</span>
            <span style={{ width: 12, height: 12, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 2 }} />
            <span style={{ width: 12, height: 12, background: '#F0F5FF', border: '1px solid #D4E2FD', borderRadius: 2 }} />
            <span>1–5</span>
            <span style={{ width: 12, height: 12, background: '#DBEAFE', border: '1px solid #BFDBFE', borderRadius: 2 }} />
            <span>6–20</span>
            <span style={{ width: 12, height: 12, background: '#93C5FD', border: '1px solid #60A5FA', borderRadius: 2 }} />
            <span>21–50</span>
            <span style={{ width: 12, height: 12, background: '#2563EB', borderRadius: 2 }} />
            <span>51+</span>
          </div>
        </div>

        {/* Breakdown List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '0.6rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>Samarqand viloyati</span>
              <strong>63 ta</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              16 tasi fiskal tizimga ulangan
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '0.6rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>Hududi ko‘rsatilmagan</span>
              <strong>49 ta</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              15 tasi fiskal tizimga ulangan
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '0.6rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>Toshkent viloyati</span>
              <strong>1 ta</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              1 tasi fiskal tizimga ulangan
            </div>
          </div>

          <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '0.6rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>Toshkent shahri</span>
              <strong>1 ta</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              0 tasi fiskal tizimga ulangan
            </div>
          </div>

          <p style={{ fontSize: '0.73rem', color: '#94a3b8', margin: '0.35rem 0 0', lineHeight: 1.4 }}>
            Qolgan 11 ta viloyatda hali korxona yo‘q: Qoraqalpog‘iston, Xorazm, Navoiy, Buxoro, Jizzax, Sirdaryo, Namangan, Andijon, Farg‘ona, Qashqadaryo, Surxondaryo
          </p>
        </div>
      </div>
    </div>
  );
}
