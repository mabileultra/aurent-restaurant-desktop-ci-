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
        <button type="button" className="bc-btn bc-btn--primary" onClick={p.openPaymentModal}>
          <Plus size={16} aria-hidden />
          {p.t('platform.billing.collections.addPayment')}
        </button>
      )}
    >
      <nav className="bc-views" aria-label={p.t('platform.billing.title')}>
        {VIEWS.map((key) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'bc-views__btn bc-views__btn--active' : 'bc-views__btn'}
            onClick={() => setView(key)}
          >
            {p.t(`platform.billing.collections.views.${key}`)}
          </button>
        ))}
      </nav>

      {view === 'overview' ? (
        <>
          <BillingKpiCards t={p.t} money={p.money} overview={c.overview} tab={c.tab} onTab={c.setTab} />

          <div className="bc-card bc-toolbar">
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
          initialCompanyId={p.selectedCompanyId}
          busy={p.manualPaymentBusy}
          onClose={p.closePaymentModal}
          onSubmit={p.submitManualPayment}
        />
      ) : null}

      {p.actions.bulkMode ? <BillingBulkModal p={p} /> : null}
    </PageLayout>
  );
}
