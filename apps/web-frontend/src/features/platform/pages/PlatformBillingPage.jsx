import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import '../../../styles/billing.css';
import '../../../styles/platform/billing-collections.css';
import { PageLayout } from '../../../components/ui';
import BillingKpiCards from '../components/billing/BillingKpiCards';
import BillingFiltersBar from '../components/billing/BillingFiltersBar';
import BillingCompaniesTable from '../components/billing/BillingCompaniesTable';
import BillingCompanyDrawer from '../components/billing/BillingCompanyDrawer';
import BillingAddPaymentModal from '../components/billing/BillingAddPaymentModal';
import BillingBulkModal from '../components/billing/BillingBulkModal';
import BillingReportsView from '../components/billing/BillingReportsView';
import BillingCalendarView from '../components/billing/BillingCalendarView';
import { usePlatformBillingPage } from '../hooks/usePlatformBillingPage';

const VIEWS = ['overview', 'reports', 'calendar'];

export default function PlatformBillingPage() {
  const p = usePlatformBillingPage();
  const c = p.collections;
  const [searchParams, setSearchParams] = useSearchParams();
  const view = VIEWS.includes(searchParams.get('view')) ? searchParams.get('view') : 'overview';
  const setView = (next) => setSearchParams(next === 'overview' ? {} : { view: next }, { replace: true });

  return (
    <PageLayout
      spacing="space-y-4"
      className="billing-page bc-page"
      title={p.t('platform.billing.title')}
      subtitle={p.t('platform.billing.subtitle')}
      actions={(
        <button
          type="button"
          className="aa-btn aa-btn--primary aa-size-md inline-flex items-center gap-1.5 cursor-pointer"
          onClick={() => p.openPaymentModal()}
        >
          <Plus size={16} aria-hidden />
          <span>{p.t('platform.billing.collections.addPayment')}</span>
        </button>
      )}
    >
      <nav className="aa-tabs" aria-label={p.t('platform.billing.title')}>
        {VIEWS.map((key) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'aa-tabs__tab aa-tabs__tab--active' : 'aa-tabs__tab'}
            onClick={() => setView(key)}
          >
            {p.t(`platform.billing.collections.views.${key}`)}
          </button>
        ))}
      </nav>

      {view === 'overview' ? (
        <>
          <BillingKpiCards t={p.t} money={p.money} overview={c.overview} tab={c.tab} onTab={c.setTab} />

          <div className="platform-filter-bar platform-filter-bar--aa bg-aa-surface border border-aa-line rounded-aa-lg p-3 sm:p-4 shadow-none">
            <BillingFiltersBar t={p.t} c={c} plans={p.plans} />
          </div>

          <BillingCompaniesTable p={p} />
        </>
      ) : null}

      {view === 'reports' ? <BillingReportsView t={p.t} money={p.money} p={p} /> : null}

      {view === 'calendar' ? (
        <BillingCalendarView
          t={p.t}
          money={p.money}
          dateLocale={p.dateLocale}
          p={p}
          onOpenCompany={(id) => {
            p.openCompanyById(id);
          }}
        />
      ) : null}

      <BillingCompanyDrawer p={p} />

      {p.paymentModalOpen ? (
        <BillingAddPaymentModal
          t={p.t}
          companies={p.allCompanies}
          initialCompanyId={p.paymentTargetCompanyId || p.selectedCompanyId}
          busy={p.manualPaymentBusy}
          onClose={p.closePaymentModal}
          onSubmit={p.submitManualPayment}
        />
      ) : null}

      {p.actions.bulkMode ? <BillingBulkModal p={p} /> : null}
    </PageLayout>
  );
}
