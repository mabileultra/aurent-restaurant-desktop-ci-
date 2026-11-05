import React, { useMemo } from 'react';
import { fmtMoney, sanitizeText } from '../utils/analyticsFormat';
import AnalyticsRegionCompaniesMiniTable from './AnalyticsRegionCompaniesMiniTable';

export default function AnalyticsRegionDetailPanel({
  regionName = 'Samarqand viloyati',
  districts = [],
  companies = [],
  selectedDistrict = 'all',
  onSelectDistrict,
  weeklyBars = [],
}) {
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (selectedDistrict === 'all') return true;
      return c.districtCode === selectedDistrict;
    });
  }, [companies, selectedDistrict]);

  const chartBars = useMemo(() => {
    if (Array.isArray(weeklyBars) && weeklyBars.length > 0) {
      const max = Math.max(...weeklyBars.map((b) => Number(b.amount || 0)), 1);
      return weeklyBars.map((b) => {
        const amt = Number(b.amount || 0);
        return {
          label: b.label,
          amount: amt,
          heightPct: amt > 0 ? Math.max(4, (amt / max) * 100) : 0,
        };
      });
    }
    const source = districts.length > 0 ? districts.slice(0, 5) : filteredCompanies.slice(0, 5);
    const max = Math.max(...source.map((item) => Number(item.totalTurnover || 0)), 1);
    return source.map((item) => {
      const tot = Number(item.totalTurnover || 0);
      return {
        label: sanitizeText(item.nameUz || item.name || 'Hudud'),
        amount: tot,
        heightPct: tot > 0 ? Math.max(4, (tot / max) * 100) : 0,
      };
    });
  }, [weeklyBars, districts, filteredCompanies]);

  const maxAmount = useMemo(() => Math.max(...chartBars.map((b) => b.amount), 1), [chartBars]);

  return (
    <section className="card an-card" aria-labelledby="drill" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: '#C9DAFB', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 id="drill" className="t">{sanitizeText(regionName)} — tumanlar va korxonalar</h2>
          <p className="s">Tuman tanlansa, shu tumandagi korxonalar chiqadi · korxona bosilsa tafsilot ochiladi</p>
        </div>
      </div>

      {/* District Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`chip${selectedDistrict === 'all' ? ' on' : ''}`}
          onClick={() => onSelectDistrict && onSelectDistrict('all')}
        >
          Barcha tumanlar · {companies.length}
        </button>
        {districts.map((d) => (
          <button
            key={d.code}
            type="button"
            className={`chip${selectedDistrict === d.code ? ' on' : ''}`}
            onClick={() => onSelectDistrict && onSelectDistrict(d.code)}
          >
            {sanitizeText(d.nameUz || d.nameRu)}
          </button>
        ))}
      </div>

      {/* 2 Columns: Chart & Table */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Left Column: Turnover Bar Chart */}
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="k">Tumanlar bo‘yicha aylanma, so‘m</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div aria-hidden="true" style={{ position: 'relative', flex: '0 0 54px', height: '170px' }}>
              <span style={{ position: 'absolute', right: 0, bottom: 0, transform: 'translateY(50%)', fontSize: '11px', color: '#6B7280' }}>0</span>
              <span style={{ position: 'absolute', right: 0, bottom: '50%', transform: 'translateY(50%)', fontSize: '11px', color: '#6B7280' }}>{fmtMoney(maxAmount / 2, { showCurrency: false })}</span>
              <span style={{ position: 'absolute', right: 0, top: 0, transform: 'translateY(50%)', fontSize: '11px', color: '#6B7280' }}>{fmtMoney(maxAmount, { showCurrency: false })}</span>
            </div>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ position: 'relative', height: '170px', borderBottom: '1px solid #D1D5DB' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '50%', height: '1px', background: '#EEF1F4', zIndex: 0 }} />
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%', gap: '8px', padding: '0 8px', position: 'relative', zIndex: 1 }}>
                  {chartBars.map((bar, i) => (
                    <div key={bar.label || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#1F2937', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                        {bar.amount > 0 ? fmtMoney(bar.amount, { showCurrency: false }) : '0'}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '36px',
                          height: `${bar.heightPct}%`,
                          background: bar.amount > 0 ? '#2563EB' : 'transparent',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '8px', padding: '6px 8px 0', fontSize: '11px', color: '#6B7280' }}>
                {chartBars.map((bar, i) => (
                  <span key={bar.label || i} style={{ flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bar.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Paginated Companies Table */}
        <AnalyticsRegionCompaniesMiniTable companies={filteredCompanies} />
      </div>
    </section>
  );
}
