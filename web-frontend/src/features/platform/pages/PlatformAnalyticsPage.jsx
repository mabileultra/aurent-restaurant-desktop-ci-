import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '../../../components/ui';
import '../../../styles/platform/analytics.css';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';
import AnalyticsComingSoon from '../components/analytics/AnalyticsComingSoon';
import AnalyticsPeriodToolbar from '../components/analytics/AnalyticsPeriodToolbar';
import AnalyticsStoresPanel from '../components/analytics/AnalyticsStoresPanel';
import AnalyticsProductsPanel from '../components/analytics/AnalyticsProductsPanel';
import AnalyticsSalesPanel from '../components/analytics/AnalyticsSalesPanel';
import AnalyticsPaymentsPanel from '../components/analytics/AnalyticsPaymentsPanel';
import AnalyticsFiscalPanel from '../components/analytics/AnalyticsFiscalPanel';
import { usePlatformAnalyticsOverview } from '../hooks/usePlatformAnalyticsOverview';
import { usePlatformAnalyticsStores } from '../hooks/usePlatformAnalyticsStores';
import { usePlatformAnalyticsProducts } from '../hooks/usePlatformAnalyticsProducts';
import { usePlatformAnalyticsSales } from '../hooks/usePlatformAnalyticsSales';
import { usePlatformAnalyticsPayments } from '../hooks/usePlatformAnalyticsPayments';
import { usePlatformAnalyticsFiscal } from '../hooks/usePlatformAnalyticsFiscal';
import { usePlatformAnalyticsExport } from '../hooks/usePlatformAnalyticsExport';

function Toolbar({ t, period, setPeriod, periodLabel, isLive, view }) {
  const { exporting, exportExcel } = usePlatformAnalyticsExport(view, period);
  return (
    <AnalyticsPeriodToolbar
      t={t}
      period={period}
      onPeriod={setPeriod}
      periodLabel={periodLabel}
      isLive={isLive}
      onExport={exportExcel}
      exporting={exporting}
    />
  );
}

function OverviewPane() {
  const { t } = useTranslation();
  const { period, setPeriod, data, loading, error, isLive } = usePlatformAnalyticsOverview();

  return (
    <>
      <Toolbar t={t} period={period} setPeriod={setPeriod} periodLabel={data?.periodLabel} isLive={isLive} view="overview" />
      {loading ? <p className="pa-muted">{t('common.loading')}</p> : null}
      {error && data?.demo ? (
        <p className="pa-demo-banner" role="status">{t('platform.analytics.demoFallback')}</p>
      ) : null}
      {data ? <AnalyticsOverview t={t} data={{ ...data, demo: Boolean(data.demo && !isLive) }} /> : null}
    </>
  );
}

function StoresPane() {
  const { t } = useTranslation();
  const { period, setPeriod, data, loading, error, isLive } = usePlatformAnalyticsStores();

  return (
    <>
      <Toolbar t={t} period={period} setPeriod={setPeriod} periodLabel={data?.periodLabel} isLive={isLive} view="stores" />
      {loading ? <p className="pa-muted">{t('common.loading')}</p> : null}
      {error ? (
        <p className="pa-demo-banner" role="status">{t('platform.analytics.stores.loadFailed')}</p>
      ) : null}
      {data ? <AnalyticsStoresPanel t={t} data={data} /> : null}
    </>
  );
}

function ProductsPane() {
  const { t } = useTranslation();
  const { period, setPeriod, data, loading, error, isLive } = usePlatformAnalyticsProducts();

  return (
    <>
      <Toolbar t={t} period={period} setPeriod={setPeriod} periodLabel={data?.periodLabel} isLive={isLive} view="products" />
      {loading ? <p className="pa-muted">{t('common.loading')}</p> : null}
      {error ? (
        <p className="pa-demo-banner" role="status">{t('platform.analytics.products.loadFailed')}</p>
      ) : null}
      {data ? <AnalyticsProductsPanel t={t} data={data} /> : null}
    </>
  );
}

function SalesPane() {
  const { t } = useTranslation();
  const { period, setPeriod, data, loading, error, isLive } = usePlatformAnalyticsSales();

  return (
    <>
      <Toolbar t={t} period={period} setPeriod={setPeriod} periodLabel={data?.periodLabel} isLive={isLive} view="sales" />
      {loading ? <p className="pa-muted">{t('common.loading')}</p> : null}
      {error ? (
        <p className="pa-demo-banner" role="status">{t('platform.analytics.sales.loadFailed')}</p>
      ) : null}
      {data ? <AnalyticsSalesPanel t={t} data={data} /> : null}
    </>
  );
}

function PaymentsPane() {
  const { t } = useTranslation();
  const { period, setPeriod, data, loading, error, isLive } = usePlatformAnalyticsPayments();

  return (
    <>
      <Toolbar t={t} period={period} setPeriod={setPeriod} periodLabel={data?.periodLabel} isLive={isLive} view="payments" />
      {loading ? <p className="pa-muted">{t('common.loading')}</p> : null}
      {error ? (
        <p className="pa-demo-banner" role="status">{t('platform.analytics.payments.loadFailed')}</p>
      ) : null}
      {data ? <AnalyticsPaymentsPanel t={t} data={data} /> : null}
    </>
  );
}

function FiscalPane() {
  const { t } = useTranslation();
  const { period, setPeriod, data, loading, error, isLive } = usePlatformAnalyticsFiscal();

  return (
    <>
      <Toolbar t={t} period={period} setPeriod={setPeriod} periodLabel={data?.periodLabel} isLive={isLive} view="fiscal" />
      {loading ? <p className="pa-muted">{t('common.loading')}</p> : null}
      {error ? (
        <p className="pa-demo-banner" role="status">{t('platform.analytics.fiscal.loadFailed')}</p>
      ) : null}
      {data ? <AnalyticsFiscalPanel t={t} data={data} /> : null}
    </>
  );
}

export default function PlatformAnalyticsPage() {
  const { t } = useTranslation();

  return (
    <PageLayout
      spacing="space-y-4"
      className="pa-page"
      title={t('platform.analytics.title')}
      subtitle={t('platform.analytics.subtitle')}
    >
      <Routes>
        <Route index element={<OverviewPane />} />
        <Route path="stores" element={<StoresPane />} />
        <Route path="products" element={<ProductsPane />} />
        <Route path="sales" element={<SalesPane />} />
        <Route path="fiscal" element={<FiscalPane />} />
        <Route path="payments" element={<PaymentsPane />} />
        <Route path="customers" element={<AnalyticsComingSoon t={t} tabKey="customers" />} />
        <Route path="geography" element={<AnalyticsComingSoon t={t} tabKey="geography" />} />
        <Route path="anomalies" element={<AnalyticsComingSoon t={t} tabKey="anomalies" />} />
        <Route path="*" element={<Navigate to="/platform/analytics" replace />} />
      </Routes>
    </PageLayout>
  );
}
