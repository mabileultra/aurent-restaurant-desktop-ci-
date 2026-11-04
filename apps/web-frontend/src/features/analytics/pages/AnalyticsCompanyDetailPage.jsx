import React from 'react';
import '../styles/analytics.css';
import AnalyticsCompanyDailyChart from '../components/AnalyticsCompanyDailyChart';
import AnalyticsCompanyDetailHeader from '../components/AnalyticsCompanyDetailHeader';
import AnalyticsCompanyDetailKpis from '../components/AnalyticsCompanyDetailKpis';
import AnalyticsCompanyReceiptsDrawer from '../components/AnalyticsCompanyReceiptsDrawer';
import AnalyticsCompanyTopProducts from '../components/AnalyticsCompanyTopProducts';
import AnalyticsCompanyWeeklyChart from '../components/AnalyticsCompanyWeeklyChart';
import { useAnalyticsCompanyDetail } from '../hooks/useAnalyticsCompanyDetail';

export default function AnalyticsCompanyDetailPage() {
  const page = useAnalyticsCompanyDetail();

  return (
    <div className="an-shell">
      <main className="an-main">
      <AnalyticsCompanyDetailHeader
        company={page.detail}
        period={page.period}
        setPeriod={page.setPeriod}
        onExport={() => window.print()}
      />

      <AnalyticsCompanyDetailKpis
        detail={page.detail}
        periodLabel={page.period === '7d' ? '7 kun' : '30 kun'}
      />

      <div className="an-two-cols" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)' }}>
        <AnalyticsCompanyDailyChart
          days={page.detail?.days}
          selectedDay={page.selectedDay}
          onSelectDay={page.setSelectedDay}
        />
        <AnalyticsCompanyReceiptsDrawer
          date={page.selectedDay}
          storeName={page.detail?.name ? `${page.detail.name} do‘koni` : 'Farina Invest do‘koni'}
          receipts={page.receipts}
          total={page.totalReceipts}
          onSelectReceipt={page.setSelectedReceipt}
        />
      </div>

      <div className="an-two-cols an-two-cols--equal" style={{ marginTop: '1rem' }}>
        <AnalyticsCompanyTopProducts
          products={page.detail?.topProducts}
        />
        <AnalyticsCompanyWeeklyChart
          weeks={page.detail?.weeks}
        />
      </div>
      </main>
    </div>
  );
}
