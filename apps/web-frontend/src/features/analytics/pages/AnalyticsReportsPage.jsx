import React, { useMemo, useState } from 'react';
import '../styles/analytics.css';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsReportsHistoryTable from '../components/AnalyticsReportsHistoryTable';
import { analyticsApi } from '../api/analyticsApi';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';
import { fetchAllCompanies } from '../utils/analyticsCompanyLoader';
import { exportToCsv, exportToExcel } from '../utils/analyticsExport';
import { buildReportPayload } from '../utils/analyticsReportBuilder';
import { REPORT_TYPES } from '../utils/analyticsReportConstants';

export default function AnalyticsReportsPage() {
  const page = useAnalyticsOverview();
  const [selectedType, setSelectedType] = useState('companies');
  const [format, setFormat] = useState('excel');
  const [history, setHistory] = useState([]);

  const allCompaniesQuery = useQuery({
    queryKey: ['analytics-reports-all-companies', page.period],
    queryFn: () => fetchAllCompanies({ period: page.period }),
  });

  const topCompanies = useMemo(
    () => page.top10Companies.slice(0, 4),
    [page.top10Companies]
  );

  const recentReceiptsQuery = useQuery({
    queryKey: ['analytics-reports-receipts', topCompanies.map((c) => c.companyId)],
    queryFn: async () => {
      if (topCompanies.length === 0) return [];
      const settled = await Promise.allSettled(
        topCompanies.map(async (c) => {
          const detail = await analyticsApi.getCompanyDetail(c.companyId).then((r) => r.data).catch(() => null);
          const daysWithSales = detail?.days?.filter((d) => Number(d.totalTurnover || 0) > 0) || [];
          const activeDate = daysWithSales[0]?.date || detail?.days?.[0]?.date;
          if (!activeDate) return [];
          const res = await analyticsApi.getCompanyReceipts(c.companyId, { date: activeDate, size: 50 }).catch(() => null);
          const rows = res?.data?.rows ?? [];
          return rows.map((r) => ({ ...r, companyName: c.name }));
        })
      );
      return settled.filter((s) => s.status === 'fulfilled').flatMap((s) => s.value);
    },
    enabled: selectedType === 'receipts' && topCompanies.length > 0,
  });

  const handleGenerateReport = () => {
    const sortedCompanies = [...(allCompaniesQuery.data?.rows ?? [])].sort(
      (a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0)
    );

    const payload = buildReportPayload(selectedType, {
      kpi: page.kpi,
      totals: page.totals,
      topRegions: page.topRegions,
      companies: sortedCompanies.length > 0 ? sortedCompanies : page.top10Companies,
      receipts: recentReceiptsQuery.data ?? [],
    });

    const filename = `hisobot-${selectedType}-${page.period}`;
    if (format === 'excel') {
      exportToExcel(filename, payload.headers, payload.rows);
    } else {
      exportToCsv(filename, payload.headers, payload.rows);
    }

    setHistory((prev) => [
      {
        id: `h-${Date.now()}`,
        report: payload.title,
        period: page.period === '7d' ? '7 kun' : page.period === 'today' ? 'Bugun' : '30 kun',
        filters: page.selectedRegionCode ? 'Tanlangan viloyat' : 'Barchasi',
        rows: payload.rows.length,
        format: format === 'excel' ? 'Excel' : 'CSV',
        status: payload.rows.length > 0 ? 'ready' : 'empty',
      },
      ...prev.slice(0, 7),
    ]);
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
                  Excel (.xml)
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

        <AnalyticsReportsHistoryTable history={history} onDownload={handleGenerateReport} />
      </main>
    </div>
  );
}
