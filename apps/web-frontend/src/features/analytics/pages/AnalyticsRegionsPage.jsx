import React, { useState } from 'react';
import '../styles/analytics.css';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analyticsApi';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsRegionDrilldownHeader from '../components/AnalyticsRegionDrilldownHeader';
import AnalyticsRegionCards from '../components/AnalyticsRegionCards';
import AnalyticsRegionDetailPanel from '../components/AnalyticsRegionDetailPanel';
import AnalyticsRegionBottomStats from '../components/AnalyticsRegionBottomStats';
import AnalyticsRegionsTable from '../components/AnalyticsRegionsTable';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';
import { fetchAllCompanies } from '../utils/analyticsCompanyLoader';
import { exportToCsv } from '../utils/analyticsExport';
import { fmtMoney, fmtPercent } from '../utils/analyticsFormat';

export default function AnalyticsRegionsPage() {
  const navigate = useNavigate();
  const page = useAnalyticsOverview();
  const [activeView, setActiveView] = useState('cards'); // 'cards' | 'table'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [sort, setSort] = useState('turnover_desc');
  const [fiscalStatus, setFiscalStatus] = useState('all');

  const handleExport = () => {
    const headers = ['#', 'Hudud', 'Korxonalar', 'Ulangan', 'Fiskal aylanma', 'Nofiskal aylanma', 'Umumiy aylanma', 'Fiskal ulush'];
    const rows = page.topRegions.map((r, i) => [
      i + 1,
      r.nameUz || r.nameRu || 'Hudud',
      r.enterprises || 0,
      r.connected || 0,
      fmtMoney(r.fiscalTurnover),
      fmtMoney(r.nonFiscalTurnover),
      fmtMoney(r.totalTurnover),
      fmtPercent(r.fiscalSharePct),
    ]);
    exportToCsv(`hududlar-${page.period}`, headers, rows);
  };

  const activeRegion = selectedRegion || page.topRegions[0] || (page.regions?.[0] ? { nameUz: page.regions[0].nameUz, code: page.regions[0].code } : null);

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
    queryFn: () =>
      fetchAllCompanies({
        period: page.period,
        regionCode: activeRegion?.code,
      }).then((res) => {
        const rows = res.rows ?? [];
        return [...rows].sort((a, b) => Number(b.totalTurnover || 0) - Number(a.totalTurnover || 0));
      }),
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
          onCompare={() => navigate('/platform/analytics/comparison')}
          onExport={handleExport}
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

            <AnalyticsRegionBottomStats regions={page.topRegions} />
          </>
        ) : (
          <AnalyticsRegionsTable rows={page.topRegions} />
        )}
      </main>
    </div>
  );
}
