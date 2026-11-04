import React from 'react';

export default function AnalyticsRegionBottomStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
      {/* 1. Eng yaxshi natija */}
      <section className="card" aria-labelledby="best" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="best" className="t" style={{ fontSize: '14px' }}>Eng yaxshi natija</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span><b style={{ color: '#6B7280', marginRight: '8px' }}>1</b>Samarqand viloyati</span>
          <span className="up">4,19 mlrd · ↑ 714,5%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span><b style={{ color: '#6B7280', marginRight: '8px' }}>2</b>Hududi ko‘rsatilmagan</span>
          <span className="up">205,2 mln · ↑ 142,0%</span>
        </div>
      </section>

      {/* 2. Past natija — korxona bor, savdo yo'q */}
      <section className="card" aria-labelledby="worst" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="worst" className="t" style={{ fontSize: '14px' }}>Past natija — korxona bor, savdo yo‘q</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>Toshkent shahri</span>
          <span style={{ color: '#6B7280' }}>1 korxona · ulanmagan · 0 so‘m</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>Toshkent viloyati</span>
          <span style={{ color: '#6B7280' }}>1 korxona · ulangan · 0 so‘m</span>
        </div>
      </section>

      {/* 3. Ulanmaganlar ko'p hududlar */}
      <section className="card" aria-labelledby="unc" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 id="unc" className="t" style={{ fontSize: '14px' }}>Ulanmaganlar ko‘p hududlar</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>Samarqand viloyati</span>
          <span className="dn">47 ta · 74,6%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>Hududi ko‘rsatilmagan</span>
          <span className="dn">34 ta · 69,4%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>Toshkent shahri</span>
          <span className="dn">1 ta · 100%</span>
        </div>
      </section>
    </div>
  );
}
