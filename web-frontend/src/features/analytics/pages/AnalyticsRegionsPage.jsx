import React, { useState } from 'react';
import '../styles/analytics.css';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsTabs from '../components/AnalyticsTabs';
import AnalyticsRegionDrilldownHeader from '../components/AnalyticsRegionDrilldownHeader';
import AnalyticsRegionCards from '../components/AnalyticsRegionCards';
import AnalyticsRegionDetailPanel from '../components/AnalyticsRegionDetailPanel';
import AnalyticsRegionBottomStats from '../components/AnalyticsRegionBottomStats';
import AnalyticsRegionsTable from '../components/AnalyticsRegionsTable';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';

export default function AnalyticsRegionsPage() {
  const page = useAnalyticsOverview();
  const [activeView, setActiveView] = useState('cards'); // 'cards' | 'table'
  const [selectedRegion, setSelectedRegion] = useState('Samarqand viloyati');
  const [sort, setSort] = useState('turnover');
  const [fiscalStatus, setFiscalStatus] = useState('all');

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

      <AnalyticsRegionDrilldownHeader
        activeView={activeView}
        setActiveView={setActiveView}
        sort={sort}
        setSort={setSort}
        fiscalStatus={fiscalStatus}
        setFiscalStatus={setFiscalStatus}
        onCompare={() => {}}
        onExport={() => {}}
      />

      {activeView === 'cards' ? (
        <>
          <AnalyticsRegionCards
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />

          <AnalyticsRegionDetailPanel
            regionName={selectedRegion}
          />

          <AnalyticsRegionBottomStats />
        </>
      ) : (
        <AnalyticsRegionsTable onExport={() => {}} />
      )}
    </div>
  );
}
