import React from 'react';
import '../styles/analytics.css';
import AnalyticsBottomStatsCards from '../components/AnalyticsBottomStatsCards';
import AnalyticsFiltersBar from '../components/AnalyticsFiltersBar';
import AnalyticsFiscalShareCard from '../components/AnalyticsFiscalShareCard';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsKpiHero from '../components/AnalyticsKpiHero';
import AnalyticsTabs from '../components/AnalyticsTabs';
import AnalyticsTopCompaniesCard from '../components/AnalyticsTopCompaniesCard';
import AnalyticsTopRegionsCard from '../components/AnalyticsTopRegionsCard';
import AnalyticsTurnoverLineChart from '../components/AnalyticsTurnoverLineChart';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';

export default function AnalyticsOverviewPage() {
  const page = useAnalyticsOverview();

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

      <AnalyticsFiltersBar
        search={page.search}
        onSearchChange={page.setSearch}
        regionCode={page.selectedRegionCode || ''}
        onRegionChange={page.setSelectedRegionCode}
        connectionStatus={page.connectionStatus}
        onConnectionStatusChange={page.setConnectionStatus}
        regions={page.regions}
        districts={page.districts}
        onReset={page.handleResetFilters}
        showExtraFilters={page.showExtraFilters}
        setShowExtraFilters={page.setShowExtraFilters}
      />

      <AnalyticsKpiHero
        kpi={page.overview?.kpi}
        loading={page.loading}
      />

      <div className="an-grid-2cols-wide-left">
        <AnalyticsTurnoverLineChart />
        <AnalyticsFiscalShareCard />
      </div>

      <div className="an-grid-2cols-equal">
        <AnalyticsTopCompaniesCard />
        <AnalyticsTopRegionsCard />
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <AnalyticsBottomStatsCards />
      </div>
    </div>
  );
}
