import React from 'react';
import '../styles/analytics.css';
import { AlertCircle, RotateCcw } from 'lucide-react';
import AnalyticsBottomStatsCards from '../components/AnalyticsBottomStatsCards';
import AnalyticsFiltersBar from '../components/AnalyticsFiltersBar';
import AnalyticsFiscalShareCard from '../components/AnalyticsFiscalShareCard';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsKpiHero from '../components/AnalyticsKpiHero';
import AnalyticsTopCompaniesCard from '../components/AnalyticsTopCompaniesCard';
import AnalyticsTopRegionsCard from '../components/AnalyticsTopRegionsCard';
import AnalyticsTurnoverLineChart from '../components/AnalyticsTurnoverLineChart';
import { useAnalyticsOverview } from '../hooks/useAnalyticsOverview';

export default function AnalyticsOverviewPage() {
  const page = useAnalyticsOverview();
  const periodLabel = page.period === '7d' ? '7 kun' : page.period === 'today' ? 'Bugun' : '30 kun';

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
        {page.error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '10px',
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              color: '#991B1B',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>Serverdan ma‘lumotlarni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko‘ring.</span>
            </div>
            <button
              type="button"
              onClick={page.refetch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#fff',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '12.5px',
              }}
            >
              <RotateCcw size={14} />
              Qayta yuklash
            </button>
          </div>
        )}

        <AnalyticsFiltersBar
          search={page.search}
          onSearchChange={page.setSearch}
          regionCode={page.selectedRegionCode}
          onRegionChange={page.setSelectedRegionCode}
          connectionStatus={page.connectionStatus}
          onConnectionStatusChange={page.setConnectionStatus}
          regions={page.regions}
          onReset={page.handleResetFilters}
          showExtraFilters={page.showExtraFilters}
          setShowExtraFilters={page.setShowExtraFilters}
        />

        <AnalyticsKpiHero
          kpi={page.kpi}
          totals={page.totals}
          loading={page.loading}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <AnalyticsTurnoverLineChart />
          <AnalyticsFiscalShareCard
            fiscalTurnover={page.totals.fiscalTurnover}
            nonFiscalTurnover={page.totals.nonFiscalTurnover}
            totalTurnover={page.totals.totalTurnover}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <AnalyticsTopCompaniesCard
            companies={page.top10Companies}
            periodLabel={periodLabel}
          />
          <AnalyticsTopRegionsCard
            regions={page.topRegions}
            periodLabel={periodLabel}
          />
        </div>

        <AnalyticsBottomStatsCards
          growingRegions={page.growingRegions}
          decliningRegions={page.decliningRegions}
          kpi={page.kpi}
        />
      </main>
    </div>
  );
}
