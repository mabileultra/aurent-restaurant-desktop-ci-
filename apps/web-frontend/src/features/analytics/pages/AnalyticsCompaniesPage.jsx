import React from 'react';
import '../styles/analytics.css';
import AnalyticsCompaniesKpi from '../components/AnalyticsCompaniesKpi';
import AnalyticsCompaniesTable from '../components/AnalyticsCompaniesTable';
import AnalyticsCompanyDistributionChart from '../components/AnalyticsCompanyDistributionChart';
import AnalyticsCompanyTop10Chart from '../components/AnalyticsCompanyTop10Chart';
import AnalyticsFiltersBar from '../components/AnalyticsFiltersBar';
import AnalyticsHeader from '../components/AnalyticsHeader';
import { useAnalyticsCompanies } from '../hooks/useAnalyticsCompanies';

export default function AnalyticsCompaniesPage() {
  const page = useAnalyticsCompanies();

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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <AnalyticsCompanyTop10Chart
            companies={page.summaryRows}
          />
          <AnalyticsCompanyDistributionChart
            buckets={page.distribution.buckets}
            zeroCount={page.distribution.zeroFiscalCount}
            highCount={page.distribution.highFiscalCount}
            totalSelling={page.distribution.sellingCount}
          />
        </div>

        <AnalyticsCompaniesTable
          rows={page.rows}
          total={page.totalElements}
          page={page.page}
          size={page.size}
          setPage={page.setPage}
          setSize={page.setSize}
          loading={page.loading}
        />
      </main>
    </div>
  );
}
