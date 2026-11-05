import React from 'react';
import '../styles/analytics.css';
import AnalyticsCompaniesKpi from '../components/AnalyticsCompaniesKpi';
import AnalyticsCompaniesTable from '../components/AnalyticsCompaniesTable';
import AnalyticsCompanyDistributionChart from '../components/AnalyticsCompanyDistributionChart';
import AnalyticsCompanyTop10Chart from '../components/AnalyticsCompanyTop10Chart';
import AnalyticsFiltersBar from '../components/AnalyticsFiltersBar';
import AnalyticsHeader from '../components/AnalyticsHeader';
import { useAnalyticsCompanies } from '../hooks/useAnalyticsCompanies';
import { exportToCsv } from '../utils/analyticsExport';
import { fmtMoney, fmtPercent, sanitizeText } from '../utils/analyticsFormat';

export default function AnalyticsCompaniesPage() {
  const page = useAnalyticsCompanies();

  const handleExportAll = () => {
    const headers = ['#', 'Firma', 'STIR', 'Hudud', 'Fiskal holat', 'Umumiy aylanma', 'Fiskal aylanma', 'Nofiskal aylanma', 'Fiskal ulush'];
    const data = page.summaryRows.map((r, index) => {
      const tot = Number(r.totalTurnover || 0);
      const fisc = Number(r.fiscalTurnover || 0);
      const nonFisc = Number(r.nonFiscalTurnover || 0);
      const share = tot > 0 ? (fisc / tot) * 100 : (r.connected ? 100 : 0);
      return [
        index + 1,
        sanitizeText(r.name),
        r.tin || '',
        sanitizeText(r.regionNameUz || r.regionNameRu || 'Ko‘rsatilmagan'),
        r.connected ? 'Ulangan' : 'Ulanmagan',
        fmtMoney(tot),
        fmtMoney(fisc),
        fmtMoney(nonFisc),
        fmtPercent(share),
      ];
    });
    exportToCsv(`korxonalar-analitika-${page.period}`, headers, data);
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
        <AnalyticsFiltersBar
          search={page.search}
          onSearchChange={page.setSearch}
          regionCode={page.regionCode}
          onRegionChange={page.setRegionCode}
          connectionStatus={page.connectionStatus}
          onConnectionStatusChange={page.setConnectionStatus}
          regions={page.regions}
          onReset={page.handleReset}
          onExport={handleExportAll}
          showExtraFilters={page.showExtraFilters}
          setShowExtraFilters={page.setShowExtraFilters}
        />

        <AnalyticsCompaniesKpi
          sellingCount={page.distribution.sellingCount}
          totalCount={page.totalElements}
          top5Amount={page.top5.topAmount}
          totalAmount={page.top5.totalAmount}
          top5SharePct={page.top5.sharePct}
          nonFiscalAmount={page.nonFiscalAmount}
          notConnectedSellingCount={page.notConnectedSellingCount}
          notConnectedAmount={page.notConnectedAmount}
          periodLabel={page.period === '7d' ? '7 kun' : '30 kun'}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: '1 1 480px', minWidth: 0 }}>
            <AnalyticsCompanyTop10Chart
              companies={page.summaryRows}
            />
          </div>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <AnalyticsCompanyDistributionChart
              buckets={page.distribution.buckets}
              zeroCount={page.distribution.zeroFiscalCount}
              highCount={page.distribution.highFiscalCount}
              totalSelling={page.distribution.sellingCount}
            />
          </div>
        </div>

        <AnalyticsCompaniesTable
          rows={page.rows}
          total={page.totalElements}
          page={page.page}
          size={page.size}
          setPage={page.setPage}
          setSize={page.setSize}
          loading={page.loading}
          onExport={handleExportAll}
        />
      </main>
    </div>
  );
}
