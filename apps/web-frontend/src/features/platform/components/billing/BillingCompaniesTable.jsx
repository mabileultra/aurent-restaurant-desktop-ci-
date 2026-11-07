import React from 'react';
import { ChevronRight } from 'lucide-react';
import TablePagination from '../../../../components/shared/TablePagination';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { PlatformErrorState, BaseCheckbox } from '../../../../components/ui';
import { STATE_TONE, activeDeferralDay, balanceTone, dueHint, initials } from './billingCollectionsUi';
import BillingCompanyMobileCard from './BillingCompanyMobileCard';
import { BulkBar, ExportMenu } from './BillingCompaniesTableBulkBar';

export default function BillingCompaniesTable({ p }) {
  const { t, money, formatDate, collections: c, actions: a } = p;
  const k = (key, opts) => t(`platform.billing.collections.${key}`, opts);
  const currency = t('billing.currency');
  const regionCodes = c.pagedRows.map((r) => r.regionCode).filter(Boolean);
  const { regionName, districtName } = useGeoNameLookup(regionCodes);

  return (
    <section className="bc-card bc-table-card">
      <header className="bc-table-card__head">
        <p className="bc-table-card__title">{k('tableTotal', { count: c.total })}</p>
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
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
        {c.loading ? (
          <p className="p-4 text-center text-xs text-slate-400">{t('common.loading')}</p>
        ) : c.isError ? (
          <div className="p-4">
            <PlatformErrorState size="sm" error={c.error} onRetry={c.refetch} retryLoading={c.loading} />
          </div>
        ) : c.pagedRows.length === 0 ? (
          <p className="p-4 text-center text-xs text-slate-400">{t('platform.billing.emptyCompanies')}</p>
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
        <table className="bc-table">
          <thead>
            <tr>
              <th className="bc-table__check">
                <BaseCheckbox
                  checked={c.allPageSelected}
                  onChange={c.toggleSelectPage}
                  ariaLabel={k('bulk.selectPage')}
                  size={18}
                />
              </th>
              <th>{k('colCompany')}</th>
              <th>{t('geo.region')}</th>
              <th>{t('geo.district')}</th>
              <th>{k('colPlan')}</th>
              <th className="bc-num">{k('colMonthly')}</th>
              <th className="bc-num">{k('colBalance')}</th>
              <th>{k('colNext')}</th>
              <th>{k('colStatus')}</th>
              <th>{k('colMethod')}</th>
              <th aria-label={k('colActions')} />
            </tr>
          </thead>
          <tbody>
            {c.loading ? (
              <tr><td colSpan={11} className="bc-table__empty">{t('common.loading')}</td></tr>
            ) : c.isError ? (
              <tr>
                <td colSpan={11} className="p-4">
                  <PlatformErrorState size="sm" error={c.error} onRetry={c.refetch} retryLoading={c.loading} />
                </td>
              </tr>
            ) : c.pagedRows.length === 0 ? (
              <tr><td colSpan={11} className="bc-table__empty">{t('platform.billing.emptyCompanies')}</td></tr>
            ) : (
              c.pagedRows.map((row) => {
                const b = row.billing;
                const hint = dueHint(row, t);
                const selected = p.selectedCompanyId === b.companyId;
                return (
                  <tr
                    key={b.companyId}
                    className={selected ? 'bc-row bc-row--selected' : 'bc-row'}
                    onClick={() => p.selectCompany(row)}
                  >
                    <td className="bc-table__check" onClick={(e) => e.stopPropagation()}>
                      <BaseCheckbox
                        checked={c.selectedIds.has(b.companyId)}
                        onChange={() => c.toggleSelect(b.companyId)}
                        ariaLabel={b.companyName}
                        size={18}
                      />
                    </td>
                    <td>
                      <div className="bc-company">
                        <span className={`bc-avatar bc-avatar--${STATE_TONE[row.paymentState]}`}>
                          {initials(b.companyName)}
                        </span>
                        <span>
                          <span className="bc-company__name">{b.companyName || `#${b.companyId}`}</span>
                          <span className="bc-company__meta">
                            ID: {b.companyId}
                            {row.newCompany ? <span className="bc-new">{k('newBadge')}</span> : null}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="bc-muted">{regionName(row.regionCode)}</td>
                    <td className="bc-muted">{districtName(row.districtCode)}</td>
                    <td>
                      {b.planName
                        ? <span className="bc-pill bc-pill--plan">{b.planName}</span>
                        : <span className="bc-muted">{Number(b.monthlyTotal) > 0 ? k('customPlan') : '—'}</span>}
                    </td>
                    <td className="bc-num">{money(b.monthlyTotal)} {currency}</td>
                    <td className={`bc-num bc-text--${balanceTone(b.balance)}`}>{money(b.balance)} {currency}</td>
                    <td>
                      <span className="bc-date">{formatDate(b.nextChargeAt)}</span>
                      {hint ? <span className={`bc-sub bc-text--${hint.tone}`}>{hint.text}</span> : null}
                    </td>
                    <td>
                      <span className={`bc-badge bc-badge--${STATE_TONE[row.paymentState]}`}>
                        {k(`states.${row.paymentState}`)}
                      </span>
                      {activeDeferralDay(b) ? (
                        <span className="bc-sub bc-text--info">
                          {k('deferral.until', { date: formatDate(activeDeferralDay(b)) })}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {row.lastPaymentMethod
                        ? <span className="bc-pill">{k(`methods.${row.lastPaymentMethod}`)}</span>
                        : <span className="bc-muted">—</span>}
                    </td>
                    <td className="bc-table__chevron"><ChevronRight size={16} aria-hidden /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        className="bc-pagination"
        page={c.page}
        pageSize={c.pageSize}
        total={c.total}
        onPageChange={c.setPage}
        onPageSizeChange={c.setPageSize}
      />
    </section>
  );
}
