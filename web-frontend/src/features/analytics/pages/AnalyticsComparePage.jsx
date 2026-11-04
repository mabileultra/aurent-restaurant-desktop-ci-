import React, { useState } from 'react';
import '../styles/analytics.css';
import { ArrowLeftRight, Download, Info } from 'lucide-react';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsTabs from '../components/AnalyticsTabs';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';

const COMPARISON_KPIS = [
  { label: 'Umumiy aylanma', current: '2,07 mlrd', prev: '1,66 mlrd', diff: '+411,9 mln', pct: '↑ 24,8%', isGood: true },
  { label: 'Fiskal aylanma', current: '2,04 mlrd', prev: '1,58 mlrd', diff: '+456,2 mln', pct: '↑ 28,9%', isGood: true },
  { label: 'Nofiskal aylanma', current: '33,9 mln', prev: '78,2 mln', diff: '−44,3 mln', pct: '↓ 56,6%', isGood: true, tag: 'yaxshi' },
  { label: 'Fiskal ulush', current: '98,4%', prev: '95,3%', diff: '+3,1 foiz punkt', isGood: true },
  { label: 'Kunlik o‘rtacha', current: '295,7 mln', prev: '236,8 mln', diff: '+58,8 mln', pct: '↑ 24,8%', isGood: true },
  { label: 'Yangi ulanishlar', current: '12', prev: '8', diff: '+4 ta', pct: '↑ 50%', isGood: true },
];

const COMPARISON_ROWS = [
  { name: 'Samarqand viloyati', current: '2,04 mlrd', prev: '1,65 mlrd', diff: '+390,0 mln', pct: '↑ 23,6%', rank: 1 },
  { name: 'Hududi ko‘rsatilmagan', current: '30,0 mln', prev: '10,0 mln', diff: '+20,0 mln', pct: '↑ 200,0%', rank: 2 },
  { name: 'Toshkent shahri', current: '0', prev: '0', diff: '0', pct: '—', rank: 3 },
  { name: 'Toshkent viloyati', current: '0', prev: '0', diff: '0', pct: '—', rank: 4 },
];

export default function AnalyticsComparePage() {
  const page = useAnalyticsOverview();
  const [sliceType, setSliceType] = useState('regions');

  return (
    <div className="an-container">
      <AnalyticsHeader
        period={page.period}
        setPeriod={page.setPeriod}
        customFrom={page.customFrom}
        customTo={page.customTo}
        onCustomChange={page.handleCustomDateChange}
      />

      <AnalyticsTabs />

      {/* Comparison Period Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 12px', borderRadius: '9px', background: '#EAF1FE', color: '#1D4ED8', fontSize: '12.5px', fontWeight: 600 }}>
          <span style={{ width: '14px', height: '3px', background: '#2563EB', borderRadius: '2px' }} />
          Joriy: 26-okt – 1-noy
        </span>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>bilan</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 12px', borderRadius: '9px', background: '#F1F3F5', color: '#374151', fontSize: '12.5px', fontWeight: 600 }}>
          <span style={{ width: '14px', height: '3px', background: '#9CA3AF', borderRadius: '2px' }} />
          Oldingi: 19–25-okt
        </span>
        <button type="button" className="btn" aria-label="Davrlarni almashtirish" style={{ padding: '0 8px' }}>
          <ArrowLeftRight size={14} />
        </button>
        <span style={{ flex: '1 1 auto' }} />
        <div className="seg" role="group" aria-label="Kesim">
          <button type="button" className={sliceType === 'republic' ? 'on' : ''} onClick={() => setSliceType('republic')}>Respublika</button>
          <button type="button" className={sliceType === 'regions' ? 'on' : ''} onClick={() => setSliceType('regions')}>Hududlar</button>
          <button type="button" className={sliceType === 'companies' ? 'on' : ''} onClick={() => setSliceType('companies')}>Korxonalar</button>
        </div>
        <button type="button" className="btn">
          <Download size={14} style={{ color: '#2563EB' }} />
          Excel
        </button>
      </div>

      {/* 6 Comparison KPIs */}
      <section aria-label="Davrlar taqqoslanishi" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {COMPARISON_KPIS.map((kpi) => (
          <div key={kpi.label} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="k">{kpi.label}</span>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>{kpi.current}</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>oldingi: {kpi.prev}</span>
            <span style={{ display: 'flex', gap: '8px', fontSize: '12.5px', alignItems: 'center' }}>
              <span className="up">{kpi.diff}</span>
              {kpi.pct && <span className="up">{kpi.pct}</span>}
              {kpi.tag && <span className="badge ok" style={{ fontSize: '10.5px' }}>{kpi.tag}</span>}
            </span>
          </div>
        ))}
      </section>

      {/* Reason for Change Banner */}
      <section className="card" aria-label="O‘zgarish sababi" style={{ padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', borderColor: '#C9DAFB', background: '#F8FAFF', marginBottom: '16px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 30px' }}>
          <Info size={16} />
        </div>
        <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#1F2937' }}>
          <b>O‘sish +411,9 mln:</b> MAKON RBB birinchi marta savdo qildi (+808,9 mln), Makon Mobile +246,9 mln. <b>Asosiy pasayish:</b> Farina Invest −636,0 mln (−49,4%) — 24-oktabrdagi 1,19 mlrd lik savdo takrorlanmadi.
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E9EE' }}>
          <h3 className="t">Kesim bo‘yicha solishtirma natijalar</h3>
          <p className="s">Joriy davr va oldingi davr ko‘rsatkichlari dinamikasi</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tb">
            <thead>
              <tr>
                <th>Hudud / Korxona</th>
                <th className="r">Joriy davr</th>
                <th className="r">Oldingi davr</th>
                <th className="r">Farq, so‘m</th>
                <th className="r">O‘zgarish, %</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.name}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td className="r" style={{ fontWeight: 600 }}>{row.current}</td>
                  <td className="r" style={{ color: '#6B7280' }}>{row.prev}</td>
                  <td className="r up">{row.diff}</td>
                  <td className="r up">{row.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
