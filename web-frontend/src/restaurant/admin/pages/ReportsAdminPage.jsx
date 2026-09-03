import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BaseButton, BaseInput } from '../../../components/ui';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import { rstAnalyticsApi } from '../../api/analytics.api';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/tech-card.css';
import '../styles/analytics-admin.css';

function toDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ReportsAdminPage() {
  const { t } = useTranslation();
  const workspace = useRestaurantWorkspaceStore();
  const [tab, setTab] = useState('dish');
  const [fromDate, setFromDate] = useState(() => toDateInput(new Date()));
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));

  const params = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T00:00:00`);
    to.setDate(to.getDate() + 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [fromDate, toDate]);

  const reportQuery = useQuery({
    queryKey: ['rst-sales-report', workspace.storeId, params],
    queryFn: () => rstAnalyticsApi.salesReport(workspace.storeId, params).then((r) => r.data),
    enabled: workspace.storeId != null,
  });

  if (workspace.noAssignment) {
    return <div className="rst-notice">{t('rst.floor.noStore')}</div>;
  }

  const report = reportQuery.data;

  return (
    <section>
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.reportsTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.reportsSubtitle')}</p>
        </div>
      </div>

      {workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={workspace.pickedStoreId}
            onChange={(e) => workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{t('rst.admin.selectStore')}</option>
            {workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {!workspace.storeId ? (
        <div className="rst-notice">{t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-report__filters">
            <label>
              {t('rst.reports.from')}
              <BaseInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label>
              {t('rst.reports.to')}
              <BaseInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
            <BaseButton type="button" variant="ghost" onClick={() => reportQuery.refetch()}>
              {t('common.refresh')}
            </BaseButton>
          </div>

          {reportQuery.isError ? <div className="rst-notice">{t('rst.admin.reportsLoadFailed')}</div> : null}

          {report ? (
            <div className="rst-dash__grid" style={{ marginBottom: '1rem' }}>
              <div className="rst-dash__card"><span>{t('rst.dashboard.revenue')}</span><strong>{fmtMoneyCompact(report.totalRevenue)}</strong></div>
              <div className="rst-dash__card"><span>{t('rst.reports.payments')}</span><strong>{report.paymentCount}</strong></div>
              <div className="rst-dash__card"><span>{t('rst.dashboard.cash')}</span><strong>{fmtMoneyCompact(report.cashAmount)}</strong></div>
              <div className="rst-dash__card"><span>{t('rst.dashboard.card')}</span><strong>{fmtMoneyCompact(report.cardAmount)}</strong></div>
            </div>
          ) : null}

          <div className="rst-report__tabs">
            <button type="button" className={`rst-report__tab${tab === 'dish' ? ' is-active' : ''}`} onClick={() => setTab('dish')}>
              {t('rst.reports.byDish')}
            </button>
            <button type="button" className={`rst-report__tab${tab === 'hour' ? ' is-active' : ''}`} onClick={() => setTab('hour')}>
              {t('rst.reports.byHour')}
            </button>
          </div>

          {!report && reportQuery.isPending ? (
            <div className="rst-empty">{t('common.loading')}</div>
          ) : tab === 'dish' ? (
            <table className="rst-tech__table">
              <thead>
                <tr>
                  <th>{t('rst.reports.dish')}</th>
                  <th>{t('rst.reports.qty')}</th>
                  <th>{t('rst.reports.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {(report?.byDish ?? []).length === 0 ? (
                  <tr><td colSpan={3}>{t('rst.reports.empty')}</td></tr>
                ) : (report?.byDish ?? []).map((row) => (
                  <tr key={row.dishName}>
                    <td>{row.dishName}</td>
                    <td>{row.quantity}</td>
                    <td>{fmtMoneyCompact(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="rst-tech__table">
              <thead>
                <tr>
                  <th>{t('rst.reports.hour')}</th>
                  <th>{t('rst.reports.payments')}</th>
                  <th>{t('rst.reports.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {(report?.byHour ?? []).length === 0 ? (
                  <tr><td colSpan={3}>{t('rst.reports.empty')}</td></tr>
                ) : (report?.byHour ?? []).map((row) => (
                  <tr key={row.hour}>
                    <td>{String(row.hour).padStart(2, '0')}:00</td>
                    <td>{row.paymentCount}</td>
                    <td>{fmtMoneyCompact(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
