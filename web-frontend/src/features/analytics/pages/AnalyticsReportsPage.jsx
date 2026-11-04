import React, { useState } from 'react';
import '../styles/analytics.css';
import { Download, FileText, BarChart3, Building, ShieldCheck, Activity, Receipt, RefreshCw } from 'lucide-react';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsTabs from '../components/AnalyticsTabs';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';

const REPORT_TYPES = [
  { id: 'republic', title: 'Respublika bo‘yicha umumiy aylanma', desc: 'KPI, kunlik dinamika, fiskal ulush', icon: BarChart3 },
  { id: 'regions', title: 'Hududlar bo‘yicha aylanma', desc: 'Viloyat va tumanlar, joriy/o‘tgan davr', icon: FileText },
  { id: 'companies', title: 'Korxonalar bo‘yicha aylanma', desc: 'Fiskal, nofiskal, farq va o‘zgarish', icon: Building },
  { id: 'fiscal_share', title: 'Fiskal va nofiskal aylanma', desc: 'Ulush, haftalar va hududlar kesimida', icon: BarChart3 },
  { id: 'connection', title: 'Fiskal tizimga ulanish', desc: 'Ulangan, ulanmagan, yangi ulanishlar, xatolar', icon: ShieldCheck },
  { id: 'activity', title: 'Korxonalar faolligi', desc: 'Oxirgi faollik, savdo kunlari, nofaollar', icon: Activity },
  { id: 'receipts', title: 'Cheklar bo‘yicha hisobot', desc: 'Cheklar, summalar, QR holati', icon: Receipt },
];

const EXPORT_HISTORY = [
  { id: '1', report: 'Korxonalar bo‘yicha aylanma', period: '6-okt – 4-noy', filters: 'Barchasi', rows: 114, format: 'Excel', status: 'pending', progress: 64 },
  { id: '2', report: 'Hududlar bo‘yicha aylanma', period: '6-okt – 4-noy', filters: 'Barchasi', rows: 15, format: 'CSV', status: 'ready' },
  { id: '3', report: 'Cheklar bo‘yicha hisobot', period: '24-okt', filters: 'Farina Invest', rows: 51, format: 'Excel', status: 'ready' },
  { id: '4', report: 'Fiskal tizimga ulanish', period: '6-okt – 4-noy', filters: 'Samarqand viloyati', rows: 63, format: 'Excel', status: 'error' },
];

export default function AnalyticsReportsPage() {
  const page = useAnalyticsOverview();
  const [selectedType, setSelectedType] = useState('companies');
  const [format, setFormat] = useState('excel');

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

      {/* Top 2 Columns: Report Types & Parameters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
        {/* Left: Report Types */}
        <section aria-labelledby="types" style={{ flex: '3 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h2 id="types" className="t">Hisobot turi</h2>
            <p className="s">Tayyor hisobotlar rahbariyat uchun · tanlangan davr va filtrlar bo‘yicha</p>
          </div>
          <div role="radiogroup" aria-label="Hisobot turlari" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {REPORT_TYPES.map((rt) => {
              const isSelected = selectedType === rt.id;
              const Icon = rt.icon;
              return (
                <button
                  key={rt.id}
                  type="button"
                  className="card"
                  role="radio"
                  aria-checked={isSelected}
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderColor: isSelected ? '#2563EB' : '#E5E9EE',
                    boxShadow: isSelected ? '0 0 0 3px #DCE7FD' : '0 1px 2px rgba(16,24,40,.04)',
                    background: isSelected ? '#F5F8FF' : '#ffffff',
                  }}
                  onClick={() => setSelectedType(rt.id)}
                >
                  <span style={{ width: 36, height: 36, borderRadius: 8, background: isSelected ? '#2563EB' : '#EEF1F4', color: isSelected ? '#fff' : '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#1F2937', display: 'block' }}>{rt.title}</strong>
                    <span style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px', display: 'block' }}>{rt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Parameters Card */}
        <section className="card" style={{ flex: '2 1 360px', minWidth: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2 className="t">Hisobot parametrlari</h2>
            <p className="s">{REPORT_TYPES.find((r) => r.id === selectedType)?.title}</p>
          </div>
          <div>
            <span className="k" style={{ display: 'block', marginBottom: '6px' }}>Davr</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge info" style={{ padding: '5px 10px' }}>6-okt – 4-noy, 2026</span>
              <span className="badge mute" style={{ padding: '5px 10px' }}>Taqqoslash: 6-sen – 5-okt</span>
            </div>
          </div>
          <div>
            <span className="k" style={{ display: 'block', marginBottom: '6px' }}>Format</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`f${format === 'excel' ? ' on' : ''}`}
                style={{ justifyContent: 'center', borderColor: format === 'excel' ? '#2563EB' : '#E5E9EE', background: format === 'excel' ? '#F5F8FF' : '#ffffff', fontWeight: format === 'excel' ? 600 : 500 }}
                onClick={() => setFormat('excel')}
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                className={`f${format === 'csv' ? ' on' : ''}`}
                style={{ justifyContent: 'center', borderColor: format === 'csv' ? '#2563EB' : '#E5E9EE', background: format === 'csv' ? '#F5F8FF' : '#ffffff', fontWeight: format === 'csv' ? 600 : 500 }}
                onClick={() => setFormat('csv')}
              >
                CSV (.csv)
              </button>
            </div>
          </div>
          <button type="button" style={{ height: '40px', border: 0, borderRadius: '10px', background: '#2563EB', color: '#fff', fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
            <Download size={16} />
            Hisobotni yaratish
          </button>
        </section>
      </div>

      {/* Export History Table */}
      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #E5E9EE' }}>
          <h2 className="t">Eksport tarixi</h2>
          <p className="s">Fayllar 7 kun saqlanadi · Oxirgi 4 ta</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tb">
            <thead>
              <tr>
                <th>Hisobot</th>
                <th>Davr</th>
                <th>Filtrlar</th>
                <th className="r">Qatorlar</th>
                <th>Format</th>
                <th>Holat</th>
                <th style={{ width: '120px' }} />
              </tr>
            </thead>
            <tbody>
              {EXPORT_HISTORY.map((eh) => (
                <tr key={eh.id}>
                  <td style={{ fontWeight: 600 }}>{eh.report}</td>
                  <td>{eh.period}</td>
                  <td style={{ color: '#4B5563' }}>{eh.filters}</td>
                  <td className="r">{eh.rows}</td>
                  <td>{eh.format}</td>
                  <td>
                    {eh.status === 'ready' && <span className="badge ok">Tayyor</span>}
                    {eh.status === 'pending' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge info">Tayyorlanmoqda</span>
                        <span style={{ width: 60, height: 5, borderRadius: 3, background: '#E3EBFD', display: 'flex' }}>
                          <span style={{ width: `${eh.progress}%`, background: '#2563EB', borderRadius: 3 }} />
                        </span>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>{eh.progress}%</span>
                      </span>
                    )}
                    {eh.status === 'error' && <span className="badge no">Xato</span>}
                  </td>
                  <td className="r">
                    {eh.status === 'ready' && <button type="button" className="btn" style={{ height: '30px' }}><Download size={12} />Yuklab olish</button>}
                    {eh.status === 'pending' && <button type="button" className="btn" style={{ height: '30px' }}>Bekor qilish</button>}
                    {eh.status === 'error' && <button type="button" className="btn" style={{ height: '30px' }}><RefreshCw size={12} />Qayta</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
