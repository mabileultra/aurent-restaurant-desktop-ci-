import React, { useMemo, useState } from 'react';
import '../styles/analytics.css';
import { Download } from 'lucide-react';
import AnalyticsHeader from '../components/AnalyticsHeader';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';
import { useAnalyticsPeriodStore } from '../hooks/useAnalyticsPeriodStore';
import { fmtDeltaBadge, fmtMoney, fmtNum, fmtPercent } from '../utils/analyticsFormat';
import { exportToCsv } from '../utils/analyticsExport';

export default function AnalyticsComparePage() {
  const page = useAnalyticsOverview();
  const [sliceType, setSliceType] = useState('regions'); // 'regions' | 'companies'
  const labels = useAnalyticsPeriodStore((s) => s.getLabels());

  const kpiList = useMemo(() => {
    const kpi = page.kpi;
    const totals = page.totals;
    const turnoverDelta = fmtDeltaBadge(kpi?.totalTurnoverDeltaPct);
    const newConnDelta = fmtDeltaBadge(kpi?.newConnectionsDeltaPct);

    return [
      {
        label: 'Umumiy aylanma',
        current: fmtMoney(kpi?.totalTurnover ?? totals.totalTurnover, { showCurrency: false }),
        delta: turnoverDelta,
      },
      {
        label: 'Fiskal aylanma',
        current: fmtMoney(totals.fiscalTurnover, { showCurrency: false }),
        delta: { dir: 'neutral', text: `${fmtPercent(totals.fiscalPct)} ulush` },
      },
      {
        label: 'Nofiskal aylanma',
        current: fmtMoney(totals.nonFiscalTurnover, { showCurrency: false }),
        delta: { dir: 'neutral', text: `${fmtPercent(totals.nonFiscalPct)} ulush` },
      },
      {
        label: 'Fiskal ulush',
        current: fmtPercent(totals.fiscalPct),
        delta: { dir: 'up', text: 'Jami aylanmada' },
      },
      {
        label: 'Ulangan korxonalar',
        current: `${fmtNum(kpi?.connected || 0)} ta`,
        delta: { dir: 'neutral', text: `${fmtNum(kpi?.totalEnterprises || 0)} tadan` },
      },
      {
        label: 'Yangi ulanishlar',
        current: `${fmtNum(kpi?.newConnections || 0)} ta`,
        delta: newConnDelta,
      },
    ];
  }, [page.kpi, page.totals]);

  const handleExport = () => {
    if (sliceType === 'regions') {
      const headers = ['#', 'Hudud', 'Umumiy aylanma', 'Korxonalar', 'Ulangan', 'O‘sish'];
      const rows = page.topRegions.map((r, i) => [
        i + 1,
        r.nameUz || r.nameRu || 'Hudud',
        fmtMoney(r.totalTurnover),
        r.enterprises || 0,
        r.connected || 0,
        fmtDeltaBadge(r.turnoverDeltaPct).text,
      ]);
      exportToCsv('solishtirish-hududlar', headers, rows);
    } else {
      const headers = ['#', 'Korxona', 'STIR', 'Fiskal holat', 'Umumiy aylanma', 'Haftalik o‘zgarish'];
      const rows = page.top10Companies.map((c, i) => [
        i + 1,
        c.name,
        c.tin || '',
        c.connected ? 'Ulangan' : 'Ulanmagan',
        fmtMoney(c.totalTurnover),
        fmtPercent(c.weekDeltaPct),
      ]);
      exportToCsv('solishtirish-korxonalar', headers, rows);
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
        {/* Comparison Period Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 12px', borderRadius: '9px', background: '#EAF1FE', color: '#1D4ED8', fontSize: '12.5px', fontWeight: 600 }}>
            <span style={{ width: '14px', height: '3px', background: '#2563EB', borderRadius: '2px' }} />
            Joriy: {labels.currentLabel}
          </span>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>bilan</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 12px', borderRadius: '9px', background: '#F1F3F5', color: '#374151', fontSize: '12.5px', fontWeight: 600 }}>
            <span style={{ width: '14px', height: '3px', background: '#9CA3AF', borderRadius: '2px' }} />
            {labels.compareLabel}
          </span>
          <span style={{ flex: '1 1 auto' }} />
          <div className="seg" role="group" aria-label="Kesim">
            <button type="button" className={sliceType === 'regions' ? 'on' : ''} onClick={() => setSliceType('regions')}>Hududlar</button>
            <button type="button" className={sliceType === 'companies' ? 'on' : ''} onClick={() => setSliceType('companies')}>Korxonalar</button>
          </div>
          <button type="button" className="btn" onClick={handleExport}>
            <Download size={14} style={{ color: '#2563EB' }} />
            Excel / CSV
          </button>
        </div>

        {/* 6 Comparison KPIs */}
        <section aria-label="Davrlar taqqoslanishi" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {kpiList.map((item) => (
            <div key={item.label} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="k">{item.label}</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>{item.current}</span>
              <span style={{ display: 'flex', gap: '8px', fontSize: '12.5px', alignItems: 'center', marginTop: '4px' }}>
                <span className={item.delta.dir} style={{ fontWeight: 600 }}>{item.delta.text}</span>
              </span>
            </div>
          ))}
        </section>

        {/* Breakdown Table */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <h2 className="t" style={{ marginBottom: '12px' }}>
            {sliceType === 'regions' ? 'Hududlar bo‘yicha taqqoslash' : 'Korxonalar bo‘yicha taqqoslash'}
          </h2>
          <div className="an-table-wrap">
            <table className="an-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{sliceType === 'regions' ? 'Hudud' : 'Korxona'}</th>
                  <th>Umumiy aylanma</th>
                  <th>{sliceType === 'regions' ? 'Korxonalar' : 'STIR'}</th>
                  <th>{sliceType === 'regions' ? 'Ulangan' : 'Fiskal holat'}</th>
                  <th>O‘zgarish</th>
                </tr>
              </thead>
              <tbody>
                {sliceType === 'regions' ? (
                  page.topRegions.map((r, i) => {
                    const delta = fmtDeltaBadge(r.turnoverDeltaPct);
                    return (
                      <tr key={r.code || i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{r.nameUz || r.nameRu || 'Hudud'}</td>
                        <td><strong>{fmtMoney(r.totalTurnover)}</strong></td>
                        <td>{r.enterprises || 0}</td>
                        <td>{r.connected || 0} / {r.enterprises || 0}</td>
                        <td><span className={delta.dir}>{delta.text}</span></td>
                      </tr>
                    );
                  })
                ) : (
                  page.top10Companies.map((c, i) => {
                    const delta = fmtDeltaBadge(c.weekDeltaPct);
                    return (
                      <tr key={c.companyId || i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td><strong>{fmtMoney(c.totalTurnover)}</strong></td>
                        <td>{c.tin || '—'}</td>
                        <td><span className={`badge ${c.connected ? 'ok' : 'no'}`}>{c.connected ? 'Ulangan' : 'Ulanmagan'}</span></td>
                        <td><span className={delta.dir}>{delta.text}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
