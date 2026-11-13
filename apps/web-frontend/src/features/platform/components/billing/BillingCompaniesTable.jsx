import React from 'react';
import { ChevronRight } from 'lucide-react';
import TablePagination from '../../../../components/shared/TablePagination';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { PlatformErrorState, BaseCheckbox } from '../../../../components/ui';
import { activeDeferralDay, balanceTone, dueHint, initials } from './billingCollectionsUi';
import BillingCompanyMobileCard from './BillingCompanyMobileCard';
import { BulkBar, ExportMenu } from './BillingCompaniesTableBulkBar';

function getPaymentStatusBadge(state, label) {
  let cls = 'bg-aa-surface-sunken text-aa-ink-muted border-aa-line';
  if (state === 'ACTIVE') {
    cls = 'bg-aa-success-soft text-aa-success border-aa-line';
  } else if (state === 'NOT_BILLED') {
    cls = 'bg-aa-brand-soft text-aa-brand border-aa-line';
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

export default function BillingCompaniesTable({ p }) {
  const { t, money, formatDate, collections: c, actions: a } = p;
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  const currency = t('billing.currency');
  const regionCodes = c.pagedRows.map((r) => r.regionCode).filter(Boolean);
  const { regionName, districtName } = useGeoNameLookup(regionCodes);

  return (
    <section className="admin-table-shell admin-table-shell--aa bc-card bc-table-card rounded-aa-lg bg-aa-surface border border-aa-line overflow-hidden shadow-none">
      <header className="bc-table-card__head flex items-center justify-between p-3.5 sm:p-4 border-b border-aa-line">
        <p className="bc-table-card__title text-sm font-semibold text-aa-ink">{k('tableTotal', { count: c.total })}</p>
        <ExportMenu
          k={k}
          disabled={!c.total}
          busy={a.exporting}
          onExcel={() => a.exportExcel(false)}
          onCsv={() => a.exportCsv(false)}
        />
      </header>
      <BulkBar p={p} />

      {/* Mobile view (< 768px): Card layout without horizontal scrolling */}
      <div className="md:hidden divide-y divide-aa-line p-2 space-y-2">
        {c.loading ? (
          <p className="p-4 text-center text-xs text-aa-ink-muted">{t('common.loading')}</p>
        ) : c.isError ? (
          <div className="p-4">
            <PlatformErrorState size="sm" error={c.error} onRetry={c.refetch} retryLoading={c.loading} />
          </div>
        ) : c.pagedRows.length === 0 ? (
          <p className="p-4 text-center text-xs text-aa-ink-muted">{t('platform.billing.emptyCompanies')}</p>
        ) : (
          c.pagedRows.map((row) => (
            <BillingCompanyMobileCard
              key={row.billing?.companyId}
              row={row}
              p={p}
              c={c}
              regionName={regionName}
              districtName={districtName}
              k={k}
              currency={currency}
            />
          ))
        )}
      </div>

      {/* Desktop view (>= 768px): Traditional high-density table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="bc-table w-full text-left text-sm table-fixed border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-aa-line bg-aa-surface-sunken text-xs font-semibold text-aa-ink-muted">
              <th className="bc-table__check w-12 px-3 py-3.5 text-center">
                <BaseCheckbox
                  variant="aa"
                  checked={c.allPageSelected}
                  onChange={c.toggleSelectPage}
                  ariaLabel={k('bulk.selectPage')}
                  size={18}
                />
              </th>
              <th className="px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{k('colCompany')}</th>
              <th className="px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{t('geo.region')}</th>
              <th className="px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{t('geo.district')}</th>
              <th className="px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{k('colPlan')}</th>
              <th className="bc-num px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{k('colMonthly')}</th>
              <th className="bc-num px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{k('colBalance')}</th>
              <th className="px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{k('colNext')}</th>
              <th className="px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{k('colStatus')}</th>
              <th className="px-3 py-3.5 font-semibold text-xs text-aa-ink-muted">{k('colMethod')}</th>
              <th className="w-12 px-3 py-3.5" aria-label={k('colActions')} />
            </tr>
          </thead>
          <tbody className="divide-y divide-aa-line">
            {c.loading ? (
              <tr><td colSpan={11} className="bc-table__empty text-center text-xs text-aa-ink-muted py-8">{t('common.loading')}</td></tr>
            ) : c.isError ? (
              <tr>
                <td colSpan={11} className="p-4">
                  <PlatformErrorState size="sm" error={c.error} onRetry={c.refetch} retryLoading={c.loading} />
                </td>
              </tr>
            ) : c.pagedRows.length === 0 ? (
              <tr><td colSpan={11} className="bc-table__empty text-center text-xs text-aa-ink-muted py-8">{t('platform.billing.emptyCompanies')}</td></tr>
            ) : (
              c.pagedRows.map((row) => {
                const b = row.billing;
                const hint = dueHint(row, t);
                const selected = p.selectedCompanyId === b.companyId;
                return (
                  <tr
                    key={b.companyId}
                    className={`transition-colors cursor-pointer ${selected ? 'bg-aa-surface-selected hover:bg-aa-surface-selected' : 'hover:bg-aa-surface-hover'}`}
                    onClick={() => p.selectCompany(row)}
                  >
                    <td className="bc-table__check w-12 px-3 py-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      <BaseCheckbox
                        variant="aa"
                        checked={c.selectedIds.has(b.companyId)}
                        onChange={() => c.toggleSelect(b.companyId)}
                        ariaLabel={b.companyName}
                        size={18}
                      />
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-aa-sm bg-aa-surface-sunken text-aa-ink-muted border border-aa-line font-semibold text-xs flex items-center justify-center shrink-0">
                          {initials(b.companyName)}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-aa-ink truncate">{b.companyName || `#${b.companyId}`}</span>
                          <span className="text-xs text-aa-ink-muted flex items-center gap-1.5 mt-0.5">
                            ID: <span className="font-mono">{b.companyId}</span>
                            {row.newCompany ? (
                              <span className="px-1.5 py-0.2 rounded-aa-sm text-xs font-semibold bg-aa-brand-soft text-aa-brand border border-aa-line">
                                {k('newBadge')}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-aa-ink-muted align-middle">{regionName(row.regionCode)}</td>
                    <td className="px-3 py-3 text-xs text-aa-ink-muted align-middle">{districtName(row.districtCode)}</td>
                    <td className="px-3 py-3 align-middle">
                      {b.planName ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-aa-sm text-xs font-semibold bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
                          {b.planName}
                        </span>
                      ) : (
                        <span className="text-xs text-aa-ink-muted">{Number(b.monthlyTotal) > 0 ? k('customPlan') : '—'}</span>
                      )}
                    </td>
                    <td className="bc-num px-3 py-3 align-middle font-medium aa-num text-aa-ink whitespace-nowrap">
                      {money(b.monthlyTotal)} {currency}
                    </td>
                    <td className={`bc-num px-3 py-3 align-middle font-medium aa-num whitespace-nowrap ${balanceTone(b.balance) === 'danger' ? 'text-aa-danger' : balanceTone(b.balance) === 'warning' ? 'text-aa-warning' : 'text-aa-ink'}`}>
                      {money(b.balance)} {currency}
                    </td>
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      <span className="font-medium text-xs text-aa-ink">{formatDate(b.nextChargeAt)}</span>
                      {hint ? (
                        <span className={`block text-xs mt-0.5 font-medium ${hint.tone === 'danger' ? 'text-aa-danger' : hint.tone === 'warning' ? 'text-aa-warning' : 'text-aa-ink-muted'}`}>
                          {hint.text}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      {getPaymentStatusBadge(row.paymentState, k(`states.${row.paymentState}`))}
                      {activeDeferralDay(b) ? (
                        <span className="block text-xs text-aa-brand mt-0.5 font-medium">
                          {k('deferral.until', { date: formatDate(activeDeferralDay(b)) })}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      {row.lastPaymentMethod ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-aa-sm text-xs font-medium bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
                          {k(`methods.${row.lastPaymentMethod}`)}
                        </span>
                      ) : (
                        <span className="text-xs text-aa-ink-muted">—</span>
                      )}
                    </td>
                    <td className="w-12 px-3 py-3 text-center align-middle">
                      <button
                        type="button"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-aa-sm text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-hover transition-colors cursor-pointer"
                        aria-label={t('common.details', { defaultValue: 'Batafsil' })}
                      >
                        <ChevronRight size={16} aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        variant="aa"
        className="bc-pagination p-3 border-t border-aa-line"
        page={c.page}
        pageSize={c.pageSize}
        total={c.total}
        onPageChange={c.setPage}
        onPageSizeChange={c.setPageSize}
      />
    </section>
  );
}
