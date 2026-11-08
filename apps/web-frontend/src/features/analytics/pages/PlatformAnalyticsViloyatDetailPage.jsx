import React from 'react';
import { useParams } from 'react-router-dom';
import { useViloyatDetailAnalytics } from '../hooks/useViloyatDetailAnalytics';
import ViloyatDetailHeader from '../components/ViloyatDetailHeader';
import ViloyatBusinessTypeBar from '../components/ViloyatBusinessTypeBar';
import ViloyatTurnoverSection from '../components/ViloyatTurnoverSection';
import ViloyatSalesAnalysisSection from '../components/ViloyatSalesAnalysisSection';
import ViloyatCompaniesTableSection from '../components/ViloyatCompaniesTableSection';
import PlatformAnalyticsBackground from '../components/PlatformAnalyticsBackground';

export default function PlatformAnalyticsViloyatDetailPage() {
  const { regionCode } = useParams();
  const {
    padCode,
    regionName,
    districtCode,
    districtName,
    isDistrictView,
    activeType,
    setActiveType,
    types,
    meta,
    turnover,
    hasSales,
    fShare,
    dailyBars,
    fiscalRing,
    connRing,
    connPercent,
    currentTypeConfig,
    topProducts,
    lowProducts,
    districtsBreakdown,
    districtOptions,
    selectedDistrict,
    setSelectedDistrict,
    onClearDistrict,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    tableData,
    onPrevPage,
    onNextPage,
  } = useViloyatDetailAnalytics(regionCode);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-200/70 via-slate-100 to-slate-200/50 dark:from-slate-950 dark:via-[#0F172A] dark:to-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 overflow-hidden">
      <PlatformAnalyticsBackground />
      <div className="relative z-10 space-y-6">
        <ViloyatDetailHeader
          padCode={padCode}
          regionName={regionName}
          meta={meta}
          isDistrictView={isDistrictView}
          districtCode={districtCode}
          districtName={districtName}
          onClearDistrict={onClearDistrict}
        />

        <ViloyatBusinessTypeBar
          types={types}
          activeType={activeType}
          onSelectType={setActiveType}
        />

        <ViloyatTurnoverSection
          regionName={regionName}
          turnover={turnover}
          hasSales={hasSales}
          fShare={fShare}
          dailyBars={dailyBars}
          activeType={activeType}
          isDistrictView={isDistrictView}
          districtName={districtName}
        />

        <ViloyatSalesAnalysisSection
          turnover={turnover}
          fiscalRing={fiscalRing}
          connRing={connRing}
          connPercent={connPercent}
          currentTypeConfig={currentTypeConfig}
          topProducts={topProducts}
          lowProducts={lowProducts}
          districtsBreakdown={districtsBreakdown}
          isDistrictView={isDistrictView}
        />

      <ViloyatCompaniesTableSection
        regionCode={padCode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        districtOptions={districtOptions}
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        tableData={tableData}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
      </div>
    </div>
  );
}
