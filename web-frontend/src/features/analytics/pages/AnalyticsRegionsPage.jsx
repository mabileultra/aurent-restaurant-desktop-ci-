import React, { useState } from 'react';
import '../styles/analytics.css';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsRegionDrilldownHeader from '../components/AnalyticsRegionDrilldownHeader';
import AnalyticsRegionCards from '../components/AnalyticsRegionCards';
import AnalyticsRegionDetailPanel from '../components/AnalyticsRegionDetailPanel';
import AnalyticsRegionBottomStats from '../components/AnalyticsRegionBottomStats';
import AnalyticsRegionsTable from '../components/AnalyticsRegionsTable';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';

export default function AnalyticsRegionsPage() {
  const page = useAnalyticsOverview();
  const [activeView, setActiveView] = useState('cards'); // 'cards' | 'table'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [sort, setSort] = useState('turnover');
  const [fiscalStatus, setFiscalStatus] = useState('all');

  const activeRegion = selectedRegion || page.topRegions[0] || { nameUz: 'Samarqand viloyati', code: '1726' };

  const districtsQuery = useQuery({
    queryKey: ['analytics-districts', page.period, activeRegion?.code],
    queryFn: () => analyticsApi.getResults({
      period: page.period,
      level: 'DISTRICT',
      regionCode: activeRegion?.code,
      size: 50,
    }).then((res) => res.data?.rows ?? []),
    enabled: Boolean(activeRegion?.code),
  });

  const regionCompaniesQuery = useQuery({
    queryKey: ['analytics-region-companies', page.period, activeRegion?.code],
    queryFn: () => analyticsApi.getCompanies({
      period: page.period,
      regionCode: activeRegion?.code,
      size: 50,
    }).then((res) => res.data?.rows ?? []),
    enabled: Boolean(activeRegion?.code),
  });

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
              regions={page.topRegions}
              selectedRegion={activeRegion}
              onSelectRegion={(reg) => {
                setSelectedRegion(reg);
                setSelectedDistrict('all');
              }}
            />

            <AnalyticsRegionDetailPanel
              regionName={activeRegion?.nameUz || activeRegion?.nameRu || 'Hudud'}
              districts={districtsQuery.data ?? []}
              companies={regionCompaniesQuery.data ?? []}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
            />

            <AnalyticsRegionBottomStats />
          </>
        ) : (
          <AnalyticsRegionsTable rows={page.topRegions} />
        )}
      </main>
    </div>
  );
}
