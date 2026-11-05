import React, { useMemo } from 'react';
import { fmtDeltaBadge, fmtMoney, fmtPercent, sanitizeText } from '../utils/analyticsFormat';

export default function AnalyticsRegionBottomStats({ regions = [] }) {
  const bestRegions = useMemo(() => {
    return [...regions]
      .filter((r) => Number(r.totalTurnover || 0) > 0)
      .sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0))
      .slice(0, 2);
  }, [regions]);

  const zeroOrLowRegions = useMemo(() => {
    return [...regions]
      .filter((r) => Number(r.enterprises || 0) > 0 && Number(r.totalTurnover || 0) === 0)
      .slice(0, 2);
  }, [regions]);

  const highUnconnectedRegions = useMemo(() => {
    return [...regions]
      .filter((r) => Number(r.notConnected || 0) > 0)
      .sort((a, b) => Number(b.notConnected || 0) - Number(a.notConnected || 0))
      .slice(0, 3);
  }, [regions]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
      {/* 1. Eng yaxshi natija */}
      <section className="card" aria-labelledby="best" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="best" className="t" style={{ fontSize: '14px' }}>Eng yaxshi natija</h2>
        {bestRegions.length === 0 ? (
          <div style={{ fontSize: '12.5px', color: '#6B7280', margin: 'auto 0' }}>Aylanma mavjud emas</div>
        ) : (
          bestRegions.map((r, idx) => {
            const delta = fmtDeltaBadge(r.turnoverDeltaPct);
            return (
              <div key={r.code || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' }}>
                <span>
                  <b style={{ color: '#6B7280', marginRight: '8px' }}>{idx + 1}</b>
                  {sanitizeText(r.nameUz || r.nameRu || 'Hudud')}
                </span>
                <span className={delta.dir}>
                  {fmtMoney(r.totalTurnover)} · {delta.text}
                </span>
              </div>
            );
          })
        )}
      </section>

      {/* 2. Past natija — korxona bor, savdo yo'q */}
      <section className="card" aria-labelledby="worst" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="worst" className="t" style={{ fontSize: '14px' }}>Past natija — korxona bor, savdo yo‘q</h2>
        {zeroOrLowRegions.length === 0 ? (
          <div style={{ fontSize: '12.5px', color: '#16A34A', margin: 'auto 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>✓ Barcha korxonalarda savdo faol</span>
          </div>
        ) : (
          zeroOrLowRegions.map((r) => (
            <div key={r.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>{sanitizeText(r.nameUz || r.nameRu || 'Hudud')}</span>
              <span style={{ color: '#6B7280' }}>
                {r.enterprises} korxona · {r.connected > 0 ? 'ulangan' : 'ulanmagan'} · 0 so‘m
              </span>
            </div>
          ))
        )}
      </section>

      {/* 3. Ulanmaganlar ko'p hududlar */}
      <section className="card" aria-labelledby="unc" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="unc" className="t" style={{ fontSize: '14px' }}>Ulanmaganlar ko‘p hududlar</h2>
        {highUnconnectedRegions.length === 0 ? (
          <div style={{ fontSize: '12.5px', color: '#16A34A', margin: 'auto 0' }}>Barcha korxonalar ulangan</div>
        ) : (
          highUnconnectedRegions.map((r) => (
            <div key={r.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>{sanitizeText(r.nameUz || r.nameRu || 'Hudud')}</span>
              <span className="dn">
                {r.notConnected} ta · {fmtPercent(r.notConnectedSharePct)}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
