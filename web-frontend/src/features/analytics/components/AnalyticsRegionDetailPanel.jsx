import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { fmtMoney, fmtPercent } from '../utils/analyticsFormat';

export default function AnalyticsRegionDetailPanel({
  regionName = 'Samarqand viloyati',
  districts = [],
  companies = [],
  selectedDistrict = 'all',
  onSelectDistrict,
  weeklyBars = [],
}) {
  const navigate = useNavigate();
  const [periodType, setPeriodType] = useState('weekly');

  const filteredCompanies = companies.filter((c) => {
    if (selectedDistrict === 'all') return true;
    return c.districtCode === selectedDistrict;
  });

  const displayBars = weeklyBars.length > 0 ? weeklyBars : [
    { label: '6–11 okt', value: '213,5 mln', heightPx: 18, color: '#2563EB' },
    { label: '12–18 okt', value: '219,5 mln', heightPx: 19, color: '#2563EB' },
    { label: '19–25 okt', value: '1,61 mlrd', heightPx: 137, color: '#2563EB' },
    { label: '26 okt–1 noy', value: '2,02 mlrd', heightPx: 170, color: '#2563EB' },
    { label: '2–4 noy', value: '135,3 mln', heightPx: 12, color: '#93C5FD' },
  ];

  return (
    <section className="card" aria-labelledby="drill" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: '#C9DAFB', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 id="drill" className="t">{regionName} — tumanlar va korxonalar</h2>
          <p className="s">Tuman tanlansa, faqat shu tumandagi korxonalar qoladi · korxona bosilsa tafsilot ochiladi</p>
        </div>
        <div className="seg" role="group" aria-label="Dinamika">
          <button type="button" className={periodType === 'daily' ? 'on' : ''} onClick={() => setPeriodType('daily')}>Kunlik</button>
          <button type="button" className={periodType === 'weekly' ? 'on' : ''} onClick={() => setPeriodType('weekly')}>Haftalik</button>
          <button type="button" className={periodType === 'monthly' ? 'on' : ''} onClick={() => setPeriodType('monthly')}>Oylik</button>
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
            {d.nameUz || d.nameRu}
          </button>
        ))}
      </div>

      {/* 2 Columns: Chart & Table */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Left Column: Weekly Turnover Bar Chart */}
        <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="k">Haftalik aylanma, so‘m</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div aria-hidden="true" style={{ position: 'relative', flex: '0 0 52px', height: '170px' }}>
              <span style={{ position: 'absolute', right: 0, bottom: 0, transform: 'translateY(50%)', fontSize: '11px', color: '#6B7280' }}>0</span>
              <span style={{ position: 'absolute', right: 0, bottom: '68px', transform: 'translateY(50%)', fontSize: '11px', color: '#6B7280' }}>1 mlrd</span>
              <span style={{ position: 'absolute', right: 0, bottom: '136px', transform: 'translateY(50%)', fontSize: '11px', color: '#6B7280' }}>2 mlrd</span>
            </div>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ position: 'relative', height: '170px', borderBottom: '1px solid #D1D5DB' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '68px', height: '1px', background: '#EEF1F4' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '136px', height: '1px', background: '#EEF1F4' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', gap: '10px' }}>
                  {displayBars.map((bar) => (
                    <div key={bar.label} role="img" aria-label={`${bar.label}: ${bar.value}`} style={{ flex: '1 1 0', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap' }}>{bar.value}</span>
                      <span style={{ display: 'block', width: '56%', maxWidth: '24px', height: `${bar.heightPx}px`, background: bar.color, borderRadius: '4px 4px 0 0' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div aria-hidden="true" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {displayBars.map((bar) => (
                  <span key={bar.label} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent: 'center', fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {bar.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>Och rang — to‘liq bo‘lmagan hafta</span>
        </div>

        {/* Right Column: Companies Table */}
        <div style={{ flex: '2 1 520px', minWidth: 0, overflowX: 'auto' }}>
          <table className="tb">
            <thead>
              <tr>
                <th>Korxona</th>
                <th>Fiskal holat</th>
                <th className="r">Do‘konlar</th>
                <th className="r">Aylanma</th>
                <th className="r">Fiskal ulush</th>
                <th style={{ width: '28px' }} />
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                    Ushbu tuman uchun korxona topilmadi
                  </td>
                </tr>
              ) : (
                filteredCompanies.slice(0, 8).map((c) => {
                  const total = Number(c.totalTurnover || 0);
                  const fiscal = Number(c.fiscalTurnover || 0);
                  const share = total > 0 ? (fiscal / total) * 100 : 0;
                  return (
                    <tr key={c.companyId || c.name} style={{ cursor: 'pointer' }} onClick={() => navigate(`/platform/analytics/companies/${c.companyId}`)}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <span className={`badge ${c.connected ? 'ok' : 'no'}`}>
                          {c.connected ? 'Ulangan' : 'Ulanmagan'}
                        </span>
                      </td>
                      <td className="r">{c.storeCount || 1}</td>
                      <td className="r" style={{ fontWeight: 600 }}>{fmtMoney(total, { showCurrency: false })}</td>
                      <td className="r">{fmtPercent(share)}</td>
                      <td>
                        <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 2px 0', fontSize: '12.5px', color: '#6B7280' }}>
            <span>1–{Math.min(8, filteredCompanies.length)} / {filteredCompanies.length} korxona</span>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              onClick={() => navigate('/platform/analytics/companies')}
            >
              Barcha korxonalar →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
