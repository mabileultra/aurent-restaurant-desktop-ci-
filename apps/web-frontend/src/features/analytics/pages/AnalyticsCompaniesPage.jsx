import React from 'react';
import '../styles/analytics.css';
import AnalyticsCompaniesKpi from '../components/AnalyticsCompaniesKpi';
import AnalyticsCompaniesTable from '../components/AnalyticsCompaniesTable';
import AnalyticsCompanyDistributionChart from '../components/AnalyticsCompanyDistributionChart';
import AnalyticsCompanyTop10Chart from '../components/AnalyticsCompanyTop10Chart';
import AnalyticsFiltersBar from '../components/AnalyticsFiltersBar';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsTabs from '../components/AnalyticsTabs';
import { useAnalyticsCompanies } from '../hooks/useAnalyticsCompanies';

export default function AnalyticsCompaniesPage() {
  const page = useAnalyticsCompanies();

  return (
    <div className="an-container">
      <AnalyticsHeader
        title="Soliq analitikasi"
        subtitle="Firmalar kesimida aylanma va fiskal ulush · 6-oktabr – 4-noyabr, 2026"
        period={page.period}
        setPeriod={page.setPeriod}
        customFrom={page.customFrom}
        customTo={page.customTo}
        onCustomChange={page.handleCustomDateChange}
        onExport={() => window.print()}
        breadcrumbs={[
          { label: 'Moliya va hisob', to: '/platform/billing' },
          { label: 'Analitika', to: '/platform/analytics' },
          { label: 'Firmalar' },
        ]}
      />

      <AnalyticsTabs />

      <AnalyticsFiltersBar
        search={page.search}
        onSearchChange={page.setSearch}
        regionCode={page.regionCode}
        onRegionChange={page.setRegionCode}
        districtCode={page.districtCode}
        onDistrictChange={page.setDistrictCode}
        connectionStatus={page.connectionStatus}
        onConnectionStatusChange={page.setConnectionStatus}
        regions={page.regions}
        districts={page.districts}
        onReset={page.handleReset}
      />

      <AnalyticsCompaniesKpi
        sellingCount={page.distribution.sellingCount || 30}
        totalCount={page.totalElements || 114}
        top5Amount={page.top5.topAmount || 4110000000}
        totalAmount={page.top5.totalAmount || 4400000000}
        top5SharePct={page.top5.sharePct || 93.5}
        nonFiscalAmount={154000000}
        notConnectedSellingCount={9}
        notConnectedAmount={65700000}
        periodLabel={page.period === '7d' ? '7 kun' : '30 kun'}
      />

      <div className="an-two-cols an-two-cols--equal">
        <AnalyticsCompanyTop10Chart
          companies={page.rows}
        />
        <AnalyticsCompanyDistributionChart
          buckets={page.distribution.buckets}
          zeroCount={page.distribution.zeroFiscalCount || 10}
          highCount={page.distribution.highFiscalCount || 13}
          totalSelling={page.distribution.sellingCount || 30}
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
        onExport={() => window.print()}
      />
    </div>
  );
}
