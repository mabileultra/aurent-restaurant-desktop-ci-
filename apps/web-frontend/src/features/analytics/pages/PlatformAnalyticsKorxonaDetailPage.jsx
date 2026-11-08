import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useKorxonaDetailAnalytics } from '../hooks/useKorxonaDetailAnalytics';
import { KorxonaHeaderCard } from '../components/KorxonaHeaderCard';
import { KorxonaKpiCards } from '../components/KorxonaKpiCards';
import { KorxonaProductsAndFiscalSection } from '../components/KorxonaProductsAndFiscalSection';
import { KorxonaReceiptsSection } from '../components/KorxonaReceiptsSection';
import PlatformAnalyticsBackground from '../components/PlatformAnalyticsBackground';

export default function PlatformAnalyticsKorxonaDetailPage() {
  const { regionCode, companyId } = useParams();
  const analytics = useKorxonaDetailAnalytics(companyId, regionCode);
  const { companyInfo } = analytics;
  const backUrl = `/platform/analytics/viloyatlar/${companyInfo.regionCode || regionCode || '18'}`;
  const isNonFiscalAlert = Boolean(analytics.receiptDetail && !analytics.receiptDetail.isFiscal);

  return (
    <div
      className={`relative min-h-screen text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 overflow-hidden transition-colors duration-700 ${
        isNonFiscalAlert
          ? 'bg-gradient-to-br from-rose-200/90 via-red-100/95 to-rose-200/80 dark:from-rose-950 dark:via-red-950 dark:to-slate-950'
          : 'bg-gradient-to-br from-slate-200/70 via-slate-100 to-slate-200/50 dark:from-slate-950 dark:via-[#0F172A] dark:to-slate-950'
      }`}
    >
      <PlatformAnalyticsBackground isAlert={isNonFiscalAlert} />
      <main className="relative z-10 max-w-[1360px] mx-auto space-y-5">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Joylashuv" className="flex items-center gap-2 text-sm font-semibold flex-wrap">
          <Link
            to="/platform/analytics/viloyatlar"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline inline-flex items-center"
          >
            Viloyatlar
          </Link>
          <span aria-hidden="true" className="text-slate-400 font-normal">/</span>
          <Link
            to={backUrl}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline inline-flex items-center"
          >
            {companyInfo.regionName}
          </Link>
          <span aria-hidden="true" className="text-slate-400 font-normal">/</span>
          <span aria-current="page" className="text-slate-900 dark:text-white font-semibold">
            {companyInfo.name}
          </span>
        </nav>

        {/* 1. Header Card */}
        <KorxonaHeaderCard companyInfo={companyInfo} />

        {/* 2. 4 KPI Cards */}
        <KorxonaKpiCards cards={analytics.cards} />

        {/* 3. Fiskal holati & Top mahsulotlar */}
        <KorxonaProductsAndFiscalSection
          donuts={analytics.donuts}
          products={analytics.products}
          totalProductsCount={analytics.totalProductsCount}
          productSort={analytics.productSort}
          setProductSort={analytics.setProductSort}
          productPage={analytics.productPage}
          productFrom={analytics.productFrom}
          productTo={analytics.productTo}
          productTotalPages={analytics.productTotalPages}
          onPrevProductPage={analytics.onPrevProductPage}
          onNextProductPage={analytics.onNextProductPage}
        />

        {/* 4. Cheklar Explorer & Receipt Slip */}
        <KorxonaReceiptsSection
          companyInfo={companyInfo}
          dayChips={analytics.dayChips}
          selectedDay={analytics.selectedDay}
          dayIndex={analytics.dayIndex}
          hasPrevDay={analytics.hasPrevDay}
          hasNextDay={analytics.hasNextDay}
          onPrevDay={analytics.onPrevDay}
          onNextDay={analytics.onNextDay}
          onSelectDay={analytics.onSelectDay}
          fiscalKind={analytics.fiscalKind}
          setFiscalKind={analytics.setFiscalKind}
          dayReceipts={analytics.dayReceipts}
          totalFiscal={analytics.totalFiscal}
          totalNonFiscal={analytics.totalNonFiscal}
          dayTotalCount={analytics.dayTotalCount}
          dayTotal={analytics.dayTotal}
          dayTotalFormatted={analytics.dayTotalFormatted}
          selectedReceiptNo={analytics.selectedReceiptNo}
          onSelectReceipt={analytics.onSelectReceipt}
          receiptDetail={analytics.receiptDetail}
        />
      </main>
    </div>
  );
}
