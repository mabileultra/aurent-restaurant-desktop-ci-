import React from 'react';
import { Building2 } from 'lucide-react';
import '../../../styles/platform/tax-analytics.css';
import '../../../styles/platform/company-analytics.css';
import { PageLayout } from '../../../components/ui';
import PlatformDateRangePicker from '../components/PlatformDateRangePicker';
import AnalyticsSectionTabs from '../components/analytics/AnalyticsSectionTabs';
import CompanyAnalyticsFilters from '../components/analytics/CompanyAnalyticsFilters';
import CompanyAnalyticsTable, { CompanyAnalyticsPager } from '../components/analytics/CompanyAnalyticsTable';
import { fmtDay } from '../components/analytics/analyticsFormat';
import { useCompanyAnalyticsList } from '../hooks/useCompanyAnalyticsList';

export default function PlatformCompanyAnalyticsPage() {
  const page = useCompanyAnalyticsList();
  const { t, list } = page;
  const rows = list?.rows ?? [];

  return (
    <PageLayout
      className="ta-page ca-page"
      spacing="space-y-4"
      title={t('platform.analytics.companiesTitle')}
      subtitle={t('platform.analytics.companiesSubtitle')}
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
      {page.error ? <p className="ta-error">{t('platform.analytics.loadFailed')}</p> : null}
      {list ? (
        <p className="ta-muted ca-meta">
          {t('platform.analytics.weekCompare', {
            currentFrom: fmtDay(list.weekFrom),
            currentTo: fmtDay(list.weekTo),
            prevFrom: fmtDay(list.prevWeekFrom),
            prevTo: fmtDay(list.prevWeekTo),
          })}
        </p>
      ) : null}
      <CompanyAnalyticsFilters
        t={t}
        draft={page.draft}
        setDraft={page.setDraft}
        regions={page.regions}
        districts={page.districts}
        labelGeo={page.labelGeo}
        onApply={page.applyFilters}
        onReset={page.resetFilters}
      />
      <section className="ta-section">
        <div className="ta-section__head">
          <h2 className="ta-section__title">
            <Building2 size={16} strokeWidth={2.2} aria-hidden className="ta-inline-icon" />
            {t('platform.analytics.companiesResults')}
            {list?.totalElements != null ? ` · ${list.totalElements}` : ''}
          </h2>
        </div>
        {page.error ? null : (
          <CompanyAnalyticsTable
            t={t}
            rows={rows}
            loading={page.loading}
            page={page.page}
            size={list?.size || 20}
            labelGeo={page.labelGeo}
          />
        )}
        <CompanyAnalyticsPager
          t={t}
          page={page.page}
          size={list?.size || 20}
          total={list?.totalElements || 0}
          onPage={page.setPage}
        />
      </section>
    </PageLayout>
  );
}
