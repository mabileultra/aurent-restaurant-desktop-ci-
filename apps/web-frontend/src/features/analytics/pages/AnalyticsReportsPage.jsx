import React, { useState } from 'react';
import '../styles/analytics.css';
import { Download } from 'lucide-react';
import AnalyticsHeader from '../components/AnalyticsHeader';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';
import { exportToCsv } from '../utils/analyticsExport';
import { fmtMoney, fmtPercent } from '../utils/analyticsFormat';
import { EXPORT_HISTORY, REPORT_TYPES } from '../utils/analyticsReportConstants';

export default function AnalyticsReportsPage() {
  const page = useAnalyticsOverview();
  const [selectedType, setSelectedType] = useState('companies');
  const [format, setFormat] = useState('excel');

  const handleGenerateReport = () => {
    if (selectedType === 'regions') {
      const headers = ['Hudud', 'Korxonalar', 'Ulangan', 'Fiskal aylanma', 'Nofiskal aylanma', 'Umumiy aylanma', 'Fiskal ulush'];
      const data = page.topRegions.map((r) => [
        r.nameUz || r.nameRu || 'Hudud',
        r.enterprises || 0,
        r.connected || 0,
        fmtMoney(r.fiscalTurnover),
        fmtMoney(r.nonFiscalTurnover),
        fmtMoney(r.totalTurnover),
        fmtPercent(r.fiscalSharePct),
      ]);
      exportToCsv(`hisobot-hududlar-${page.period}`, headers, data);
    } else if (selectedType === 'companies') {
      const headers = ['Firma', 'STIR', 'Fiskal holat', 'Fiskal aylanma', 'Nofiskal aylanma', 'Umumiy aylanma'];
      const data = page.top10Companies.map((c) => [
        c.name,
        c.tin || '',
        c.connected ? 'Ulangan' : 'Ulanmagan',
        fmtMoney(c.fiscalTurnover),
        fmtMoney(c.nonFiscalTurnover),
        fmtMoney(c.totalTurnover),
      ]);
      exportToCsv(`hisobot-korxonalar-${page.period}`, headers, data);
    } else {
      const headers = ['Ko‘rsatkich', 'Qiymat'];
      const data = [
        ['Jami korxonalar', page.kpi?.totalEnterprises || 0],
        ['Ulangan korxonalar', page.kpi?.connected || 0],
        ['Ulanmagan korxonalar', page.kpi?.notConnected || 0],
        ['Umumiy aylanma', fmtMoney(page.totals.totalTurnover)],
        ['Fiskal aylanma', fmtMoney(page.totals.fiscalTurnover)],
        ['Nofiskal aylanma', fmtMoney(page.totals.nonFiscalTurnover)],
        ['Fiskal ulush', fmtPercent(page.totals.fiscalPct)],
      ];
      exportToCsv(`hisobot-respublika-${page.period}`, headers, data);
    }
  };

  return (
    <div className="an-shell">
      <AnalyticsHeader
        period={page.period}
        setPeriod={page.setPeriod}
        customFrom={page.customFrom}
        customTo={page.customTo}
        onCustomChange={page.handleCustomDateChange}
      />

      <main className="an-main">
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
                      boxShadow: isSelected ? '0 0 0 3px #DCE7FD' : 'none',
                      background: isSelected ? '#F5F8FF' : '#ffffff',
                    }}
                    onClick={() => setSelectedType(rt.id)}
                  >
                    <span style={{ width: 36, height: 36, borderRadius: 9, background: isSelected ? '#2563EB' : '#F1F3F5', color: isSelected ? '#fff' : '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 650, color: '#1F2937' }}>{rt.title}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{rt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right: Format and Generate */}
          <section className="card" style={{ flex: '1 1 300px', minWidth: '260px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 className="t" style={{ fontSize: '15px' }}>Eksport parametrlari</h3>
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
            <button
              type="button"
              onClick={handleGenerateReport}
              style={{ height: '40px', border: 0, borderRadius: '10px', background: '#2563EB', color: '#fff', fontSize: '13.5px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}
            >
              <Download size={16} />
              Hisobotni yaratish
            </button>
          </section>
        </div>

        {/* Export History Table */}
        <section className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #E5E9EE' }}>
            <h2 className="t">Eksport tarixi</h2>
            <p className="s">Fayllar 7 kun saqlanadi · Oxirgi 3 ta</p>
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
                    <td><span className="badge ok">Tayyor</span></td>
                    <td className="r">
                      <button
                        type="button"
                        className="btn"
                        style={{ height: '30px' }}
                        onClick={handleGenerateReport}
                      >
                        <Download size={12} />Yuklab olish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
