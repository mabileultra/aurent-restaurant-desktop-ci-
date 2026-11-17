import React from 'react';
import TablePagination from '../../../../components/shared/TablePagination';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { PlatformErrorState, BaseCheckbox } from '../../../../components/ui';
import BillingCompanyMobileCard from './BillingCompanyMobileCard';
import BillingCompanyTableRow from './BillingCompanyTableRow';
import { BulkBar, ExportMenu } from './BillingCompaniesTableBulkBar';

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
        <table className="bc-table w-full text-left text-sm border-collapse min-w-[900px]">
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
              c.pagedRows.map((row) => (
                <BillingCompanyTableRow
                  key={row.billing?.companyId}
                  row={row}
                  p={p}
                  c={c}
                  regionName={regionName}
                  districtName={districtName}
                  k={k}
                  formatDate={formatDate}
                  money={money}
                  currency={currency}
                  t={t}
                />
              ))
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
