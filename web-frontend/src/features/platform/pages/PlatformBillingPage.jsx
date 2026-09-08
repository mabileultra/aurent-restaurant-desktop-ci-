import '../../../styles/billing.css';
import { PageLayout, PageSearchField } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { usePlatformBillingPage } from '../hooks/usePlatformBillingPage';

export default function PlatformBillingPage() {
  const p = usePlatformBillingPage();
  const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(p.dateLocale) : '—');

  return (
    <PageLayout
      spacing="space-y-4"
      title={p.t('platform.billing.title')}
      subtitle={p.t('platform.billing.subtitle')}
      filters={(
        <div className="space-y-3">
          <PageSearchField
            value={p.search}
            onChange={(e) => p.setSearch(e.target.value)}
            placeholder={p.t('platform.billing.search')}
          />
          <div className="billing-tabs">
            {p.statusFilters.map((value) => (
              <button
                key={value || 'all'}
                type="button"
                className={`billing-tab ${p.status === value ? 'billing-tab--active' : ''}`}
                onClick={() => p.setStatus(value)}
              >
                {value ? p.t(`platform.billing.statuses.${value}`) : p.t('platform.billing.filterAll')}
              </button>
            ))}
          </div>
        </div>
      )}
    >
      <div className="billing-page space-y-4">
        <div className="billing-kpi">
          <div className="billing-kpi__card billing-kpi__card--mrr">
            <span className="billing-metric__label">MRR</span>
            <strong>{p.money(p.overview?.mrr)} {p.t('billing.currency')}</strong>
          </div>
          <div className="billing-kpi__card billing-kpi__card--active">
            <span className="billing-metric__label">{p.t('platform.billing.kpiActive')}</span>
            <strong>{p.overview?.activeCount ?? '—'}</strong>
          </div>
          <div className="billing-kpi__card billing-kpi__card--blocked">
            <span className="billing-metric__label">{p.t('platform.billing.kpiBlocked')}</span>
            <strong>{p.overview?.blockedCount ?? '—'}</strong>
          </div>
          <div className="billing-kpi__card billing-kpi__card--pending">
            <span className="billing-metric__label">{p.t('platform.billing.kpiPending')}</span>
            <strong>{p.overview?.pendingTopUps ?? '—'}</strong>
          </div>
        </div>

        <div className="billing-grid">
          <div className="billing-panel">
            <h3 className="billing-panel__title">{p.t('platform.billing.companiesTitle')}</h3>
            <div className="overflow-x-auto">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>{p.t('platform.billing.colCompany')}</th>
                    <th>{p.t('platform.billing.colPlan')}</th>
                    <th>{p.t('platform.billing.colBalance')}</th>
                    <th>{p.t('platform.billing.colNext')}</th>
                    <th>{p.t('platform.billing.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.loading ? (
                    <tr><td colSpan={5}>{p.t('common.loading')}</td></tr>
                  ) : p.companies.length === 0 ? (
                    <tr><td colSpan={5}>{p.t('platform.billing.emptyCompanies')}</td></tr>
                  ) : (
                    p.companies.map((row) => (
                      <tr
                        key={row.companyId}
                        onClick={() => {
                          p.setSelectedCompanyId(row.companyId);
                          p.setAssignPlanId(row.planId || '');
                          p.setAddonAmount(String(row.addonMonthlyAmount || 0));
                        }}
                        className={p.selectedCompanyId === row.companyId ? 'billing-row--selected cursor-pointer' : 'cursor-pointer'}
                      >
                        <td>{row.companyName || `#${row.companyId}`}</td>
                        <td>{row.planName || '—'}</td>
                        <td>{p.money(row.balance)} {p.t('billing.currency')}</td>
                        <td>{formatDate(row.nextChargeAt)}</td>
                        <td>
                          <span className={`billing-badge billing-badge--${row.status}`}>
                            {p.t(`platform.billing.statuses.${row.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={p.companiesPage}
              pageSize={p.companiesPageSize}
              total={p.companiesTotal}
              onPageChange={p.setCompaniesPage}
              onPageSizeChange={p.setCompaniesPageSize}
              pageSizeOptions={p.pageSizeOptions}
            />

            {p.selected ? (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">
                  {p.t('platform.billing.manageCompany', { name: p.selected.companyName })}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <select
                    className="billing-select"
                    value={p.assignPlanId}
                    onChange={(e) => p.setAssignPlanId(e.target.value)}
                  >
                    <option value="">{p.t('platform.billing.pickPlan')}</option>
                    {p.plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {p.money(plan.monthlyPrice)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="billing-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={p.addonAmount}
                    onChange={(e) => p.setAddonAmount(e.target.value)}
                    placeholder={p.t('platform.billing.addonAmount')}
                  />
                </div>
                <button type="button" className="billing-btn billing-btn--accent" disabled={p.busy || !p.assignPlanId} onClick={p.assignPlan}>
                  {p.t('platform.billing.assignPlan')}
                </button>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="billing-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={p.adjustAmount}
                    onChange={(e) => p.setAdjustAmount(e.target.value)}
                    placeholder={p.t('platform.billing.amount')}
                  />
                  <input
                    className="billing-input"
                    value={p.adjustNote}
                    onChange={(e) => p.setAdjustNote(e.target.value)}
                    placeholder={p.t('platform.billing.note')}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="billing-btn billing-btn--ok" disabled={p.busy || !p.adjustAmountValid} onClick={p.credit}>
                    {p.t('platform.billing.credit')}
                  </button>
                  <button type="button" className="billing-btn billing-btn--blue" disabled={p.busy || !p.adjustAmountValid} onClick={p.debit}>
                    {p.t('platform.billing.debit')}
                  </button>
                  {p.selected.status === 'BLOCKED' ? (
                    <button type="button" className="billing-btn billing-btn--violet" disabled={p.busy} onClick={p.unblock}>
                      {p.t('platform.billing.unblock')}
                    </button>
                  ) : (
                    <button type="button" className="billing-btn billing-btn--danger" disabled={p.busy} onClick={p.block}>
                      {p.t('platform.billing.block')}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="billing-topup">
            <h3 className="billing-topup__title">
              {p.t('platform.billing.queueTitle')}
              {p.topUps.length ? <span className="billing-chip billing-chip--ok ml-2">{p.topUps.length}</span> : null}
            </h3>
            <div className="billing-queue">
              {p.topUps.length === 0 ? (
                <p className="text-sm text-slate-500">{p.t('platform.billing.queueEmpty')}</p>
              ) : (
                p.topUps.map((item) => (
                  <div key={item.id} className="billing-queue__card">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{item.companyName || `#${item.companyId}`}</p>
                        <p className="text-sm text-emerald-700 font-bold">+{p.money(item.amount)} {p.t('billing.currency')}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.receiptFileName || p.t('platform.billing.noFile')}
                          {item.comment ? ` · ${item.comment}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="billing-queue__actions">
                      <button type="button" className="billing-btn billing-btn--ok" disabled={p.busy} onClick={() => p.approve(item.id)}>
                        {p.t('platform.billing.approve')}
                      </button>
                      <button type="button" className="billing-btn billing-btn--danger" disabled={p.busy} onClick={() => p.reject(item.id)}>
                        {p.t('platform.billing.reject')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="billing-panel">
          <h3 className="billing-panel__title">{p.t('platform.billing.plansTitle')}</h3>
          <div className="billing-plan-strip">
            {p.plans.map((plan) => (
              <div key={plan.id} className="billing-plan-card">
                <span className="text-xs uppercase tracking-wide text-slate-500">{plan.code}</span>
                <strong>{plan.name}</strong>
                <p className="text-sm text-slate-600">{p.money(plan.monthlyPrice)} {p.t('billing.currency')} {p.t('billing.perMonth')}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {plan.maxRegisters
                    ? p.t('billing.registersCount', { count: plan.maxRegisters })
                    : p.t('billing.registersUnlimited')}
                  {' · '}
                  {plan.maxStores
                    ? p.t('billing.storesCount', { count: plan.maxStores })
                    : p.t('billing.storesUnlimited')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
