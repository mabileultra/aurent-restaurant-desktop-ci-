import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useKorxonaDetailAnalytics } from '../hooks/useKorxonaDetailAnalytics';
import { KorxonaHeaderCard } from '../components/KorxonaHeaderCard';
import { KorxonaKpiCards } from '../components/KorxonaKpiCards';
import { KorxonaProductsAndFiscalSection } from '../components/KorxonaProductsAndFiscalSection';
import { KorxonaReceiptsSection } from '../components/KorxonaReceiptsSection';

export default function PlatformAnalyticsKorxonaDetailPage() {
  const { regionCode, companyId } = useParams();
  const analytics = useKorxonaDetailAnalytics(companyId, regionCode);
  const { companyInfo } = analytics;
  const backUrl = `/platform/analytics/viloyatlar/${companyInfo.regionCode || regionCode || '18'}`;

  return (
    <div className="min-h-screen bg-[#F3F6F4] dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <main className="max-w-[1360px] mx-auto space-y-5">
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
          totalReceiptsCount={analytics.totalReceiptsCount}
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
          pagedReceipts={analytics.pagedReceipts}
          totalFiscal={analytics.totalFiscal}
          totalNonFiscal={analytics.totalNonFiscal}
          dayTotalCount={analytics.dayTotalCount}
          dayTotal={analytics.dayTotal}
          dayTotalFormatted={analytics.dayTotalFormatted}
          totalReceiptsCount={analytics.totalReceiptsCount}
          selectedReceiptNo={analytics.selectedReceiptNo}
          onSelectReceipt={analytics.onSelectReceipt}
          receiptDetail={analytics.receiptDetail}
          receiptPage={analytics.receiptPage}
          receiptFrom={analytics.receiptFrom}
          receiptTo={analytics.receiptTo}
          receiptTotalPages={analytics.receiptTotalPages}
          receiptTotalCount={analytics.receiptTotalCount}
          onPrevReceiptPage={analytics.onPrevReceiptPage}
          onNextReceiptPage={analytics.onNextReceiptPage}
        />
      </main>
    </div>
  );
}
