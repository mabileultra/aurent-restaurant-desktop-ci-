import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseInput } from '../../../components/ui';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import AdminWorkspaceGate from '../components/AdminWorkspaceGate';
import DishSalesPanel from '../components/reports/DishSalesPanel';
import ReceiptJournalPanel from '../components/reports/ReceiptJournalPanel';
import SalesSummaryPanel from '../components/reports/SalesSummaryPanel';
import ShiftCashPanel from '../components/reports/ShiftCashPanel';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/analytics-admin.css';
import '../styles/stations-admin.css';

function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const TABS = [
  ['summary', 'rst.reports.summary.title'],
  ['checks', 'rst.reports.byChecks'],
  ['dish', 'rst.reports.byDish'],
  ['shifts', 'rst.reports.shifts.title'],
  ['debts', 'rst.reports.byDebts'],
];

export default function ReportsAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [tab, setTab] = useState('summary');
  const [fromDate, setFromDate] = useState(() => toDateInput(new Date()));
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));

  const panelProps = { storeId: workspace.storeId, fromDate, toDate, t };

  return (
    <AdminWorkspaceGate t={t} workspace={workspace}>
      <section>
        <div className="rst-halls__toolbar">
          <div>
            <h1 className="rst-coming__title">{t('rst.admin.reportsSalesCard')}</h1>
            <p className="rst-coming__text mb-0">{t('rst.admin.reportsSubtitle')}</p>
          </div>
        </div>

        <div className="rst-admin-filters">
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.reports.from')}</span>
            <BaseInput
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => e.target.value && setFromDate(e.target.value)}
            />
          </label>
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{t('rst.reports.to')}</span>
            <BaseInput
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => e.target.value && setToDate(e.target.value)}
            />
          </label>
        </div>

        <div className="rst-report__tabs">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rst-report__tab${tab === key ? ' is-active' : ''}`}
              onClick={() => setTab(key)}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {tab === 'summary' ? <SalesSummaryPanel {...panelProps} /> : null}
        {tab === 'dish' ? <DishSalesPanel {...panelProps} /> : null}
        {tab === 'shifts' ? <ShiftCashPanel {...panelProps} /> : null}
        {tab === 'checks' || tab === 'debts' ? (
          <ReceiptJournalPanel
            key={tab}
            {...panelProps}
            storeName={workspace.storeName}
            preset={tab === 'debts' ? 'debts' : 'all'}
          />
        ) : null}
      </section>
    </AdminWorkspaceGate>
  );
}
