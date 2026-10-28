import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coins, PlugZap, ShieldX } from 'lucide-react';
import '../../../styles/platform/tax-analytics.css';
import '../../../styles/platform/company-analytics.css';
import { PageLayout } from '../../../components/ui';
import PlatformDateRangePicker from '../components/PlatformDateRangePicker';
import AnalyticsSectionTabs from '../components/analytics/AnalyticsSectionTabs';
import CompanyWeekTable from '../components/analytics/CompanyWeekTable';
import { fmtMoney } from '../components/analytics/analyticsFormat';
import { useCompanyAnalyticsDetail } from '../hooks/useCompanyAnalyticsDetail';

function Kpi({ icon: Icon, tone, label, value }) {
  return (
    <div className={`ta-kpi ta-kpi--${tone}`}>
      <div className="ta-kpi__top">
        <span className={`ta-kpi__icon ta-kpi__icon--${tone}`} aria-hidden>
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <p className="ta-kpi__label">{label}</p>
      </div>
      <p className="ta-kpi__value">{value}</p>
    </div>
  );
}

export default function PlatformCompanyAnalyticsDetailPage() {
  const page = useCompanyAnalyticsDetail();
  const { t, detail } = page;
  const region = detail ? page.labelGeo(detail.regionNameRu, detail.regionNameUz) : '';
  const district = detail ? page.labelGeo(detail.districtNameRu, detail.districtNameUz) : '';

  return (
    <PageLayout
      className="ta-page ca-page"
      spacing="space-y-4"
      title={detail?.name || t('platform.analytics.companyDetailTitle')}
      subtitle={detail?.tin || t('platform.analytics.companiesSubtitle')}
      actions={(
        <div className="ta-period">
          {page.periods.map((key) => (
            <button
              key={key}
              type="button"
              className={`ta-period__btn${page.period === key ? ' is-active' : ''}`}
              onClick={() => page.setPeriod(key)}
            >
              {t(`platform.analytics.periods.${key}`)}
            </button>
          ))}
          <PlatformDateRangePicker
            from={page.customFrom}
            to={page.customTo}
            onChange={({ from, to }) => {
              page.setCustomFrom(from);
              page.setCustomTo(to);
              page.setPeriod('custom');
            }}
            placeholder={t('platform.analytics.periods.custom')}
            align="right"
            t={t}
          />
        </div>
      )}
    >
      <AnalyticsSectionTabs t={t} />
      <Link to="/platform/analytics/companies" className="ca-back">
        <ArrowLeft size={14} aria-hidden />
        {t('platform.analytics.backToCompanies')}
      </Link>
      {page.error ? <p className="ta-error">{t('platform.analytics.loadFailed')}</p> : null}
      {detail ? (
        <p className="ca-meta">
          <span>{region || '—'}</span>
          <span>{district || '—'}</span>
          <span className={`ta-badge ${detail.connected ? 'ta-badge-green' : 'ta-badge-red'}`}>
            {detail.connected ? t('platform.analytics.statusConnected') : t('platform.analytics.statusNotConnected')}
          </span>
        </p>
      ) : null}
      <div className="ta-kpi-grid">
        <Kpi
          icon={Coins}
          tone="amber"
          label={t('platform.analytics.colTotalTurnover')}
          value={page.loading ? '…' : fmtMoney(detail?.totalTurnover)}
        />
        <Kpi
          icon={PlugZap}
          tone="green"
          label={t('platform.analytics.colFiscalTurnover')}
          value={page.loading ? '…' : fmtMoney(detail?.fiscalTurnover)}
        />
        <Kpi
          icon={ShieldX}
          tone="red"
          label={t('platform.analytics.colNonFiscalTurnover')}
          value={page.loading ? '…' : fmtMoney(detail?.nonFiscalTurnover)}
        />
      </div>
      {page.error ? null : (
        <section className="ta-section">
          <div className="ta-section__head">
            <div>
              <h2 className="ta-section__title">{t('platform.analytics.weeksTitle')}</h2>
              <p className="ta-section__sub">{t('platform.analytics.weeksSubtitle')}</p>
            </div>
          </div>
          <CompanyWeekTable t={t} weeks={detail?.weeks} loading={page.loading} />
        </section>
      )}
    </PageLayout>
  );
}
