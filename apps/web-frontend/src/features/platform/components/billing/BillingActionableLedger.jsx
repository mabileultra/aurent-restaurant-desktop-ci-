import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarClock, Download, Search } from 'lucide-react';
import { platformBillingApi } from '../../../../api';
import { COLLECTIONS_QUERY_KEY } from '../../hooks/useBillingCollections';
import {
  BILLING_COLLECTIONS_ENRICH_SIZE,
  unwrapBillingCollectionsPage,
} from '../../utils/unwrapBillingCollectionsPage';
import BillingActionableLedgerRow from './BillingActionableLedgerRow';

export default function BillingActionableLedger({ t, money, p }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const currency = t('billing.currency');
  const sum = (v) => `${money(v)} ${currency}`;
  const formatDate = p?.formatDate || ((d) => (d ? new Date(d).toLocaleDateString() : '—'));

  const listQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', 'actionable-ledger'],
    queryFn: () => platformBillingApi
      .collectionsCompanies({ page: 0, size: BILLING_COLLECTIONS_ENRICH_SIZE })
      .then((r) => unwrapBillingCollectionsPage(r.data).content),
    staleTime: 60_000,
  });

  const allRows = useMemo(() => (Array.isArray(listQ.data) ? listQ.data : []), [listQ.data]);

  // Filter only companies that need attention: OVERDUE, or DUE_SOON with monthlyTotal > 0
  const dueCompanies = useMemo(() => {
    return allRows.filter((r) => {
      const b = r?.billing || {};
      const monthly = Number(b.monthlyTotal || 0);
      const balance = Number(b.balance || 0);
      const isOverdue = r.paymentState === 'OVERDUE' || balance < 0;
      if (isOverdue) return true;
      if (monthly <= 0) return false;
      const isDueSoon = r.paymentState === 'DUE_SOON' || (r.daysUntilDue != null && r.daysUntilDue <= 30);
      return isDueSoon;
    });
  }, [allRows]);

  const counts = useMemo(() => {
    let overdueCount = 0;
    let dueSoonCount = 0;
    dueCompanies.forEach((r) => {
      const b = r?.billing || {};
      if (r.paymentState === 'OVERDUE' || Number(b.balance) < 0) overdueCount++;
      else dueSoonCount++;
    });
    return { all: dueCompanies.length, overdue: overdueCount, dueSoon: dueSoonCount };
  }, [dueCompanies]);

  const filteredRows = useMemo(() => {
    return dueCompanies.filter((r) => {
      const b = r?.billing || {};
      if (filter === 'OVERDUE' && r.paymentState !== 'OVERDUE' && Number(b.balance) >= 0) return false;
      if (filter === 'DUE_SOON' && (r.paymentState === 'OVERDUE' || Number(b.balance) < 0)) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const name = (b.companyName || '').toLowerCase();
        const id = String(b.companyId || r.companyId || '');
        if (!name.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });
  }, [dueCompanies, filter, search]);

  const isExporting = Boolean(p?.actions?.exporting);
  const handleExport = () => {
    p?.actions?.exportExcel?.(false);
  };

  return (
    <div className="admin-table-shell admin-table-shell--aa bc-card bc-ledger-card rounded-aa-lg bg-aa-surface border border-aa-line p-4 sm:p-5">
      <div className="bc-ledger-card__head flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock size={16} className="text-aa-ink-muted" aria-hidden />
            <h3 className="bc-chart-card__title text-sm font-semibold text-aa-ink">
              {t('platform.billing.collections.reports.ledgerTitle', { defaultValue: 'Yaqin kunlarda to‘lashi kerak bo‘lganlar va qarzdorlar' })}
            </h3>
          </div>
          <p className="bc-chart-card__sub text-xs text-aa-ink-muted mt-1">
            {t('platform.billing.collections.reports.ledgerSub', { defaultValue: 'Muddati o‘tgan yoki yaqin 30 kun ichida to‘lov kutilayotgan kompaniyalar ro‘yxati' })}
          </p>
        </div>

        <div className="bc-ledger-card__actions flex flex-wrap items-center gap-2">
          <div className="bc-ledger-tabs aa-seg inline-flex items-center p-0.5 rounded-aa-md bg-aa-surface-sunken border border-aa-line">
            <button
              type="button"
              className={`bc-ledger-tab aa-seg-btn px-2.5 py-1 text-xs font-medium rounded-aa-sm transition-colors ${
                filter === 'ALL'
                  ? 'is-active bg-aa-surface text-aa-ink font-semibold shadow-xs'
                  : 'text-aa-ink-muted hover:text-aa-ink'
              }`}
              onClick={() => setFilter('ALL')}
            >
              {t('common.all', { defaultValue: 'Barchasi' })} ({counts.all})
            </button>
            <button
              type="button"
              className={`bc-ledger-tab bc-ledger-tab--danger aa-seg-btn px-2.5 py-1 text-xs font-medium rounded-aa-sm inline-flex items-center gap-1 transition-colors ${
                filter === 'OVERDUE'
                  ? 'is-active bg-aa-surface text-aa-danger font-semibold shadow-xs'
                  : 'text-aa-ink-muted hover:text-aa-danger'
              }`}
              onClick={() => setFilter('OVERDUE')}
            >
              <AlertCircle size={13} aria-hidden />
              {t('platform.billing.collections.states.OVERDUE', { defaultValue: 'Qarzdorlar' })} ({counts.overdue})
            </button>
            <button
              type="button"
              className={`bc-ledger-tab bc-ledger-tab--warning aa-seg-btn px-2.5 py-1 text-xs font-medium rounded-aa-sm inline-flex items-center gap-1 transition-colors ${
                filter === 'DUE_SOON'
                  ? 'is-active bg-aa-surface text-aa-warning font-semibold shadow-xs'
                  : 'text-aa-ink-muted hover:text-aa-warning'
              }`}
              onClick={() => setFilter('DUE_SOON')}
            >
              <CalendarClock size={13} aria-hidden />
              {t('platform.billing.collections.states.DUE_SOON', { defaultValue: 'Tez kunda' })} ({counts.dueSoon})
            </button>
          </div>

          <div className="bc-ledger-search relative inline-flex items-center">
            <Search size={14} className="absolute left-3 text-aa-ink-muted pointer-events-none" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search', { defaultValue: 'Qidiruv…' })}
              className="h-9 sm:h-9 h-10 pl-9 pr-3 text-xs sm:text-xs text-sm rounded-aa-md border border-aa-line-strong bg-aa-surface text-aa-ink placeholder:text-aa-ink-subtle focus:outline-none focus:ring-1 focus:ring-aa-primary"
            />
          </div>

          <button
            type="button"
            className="aa-btn aa-btn--secondary aa-size-sm inline-flex items-center gap-1.5"
            onClick={handleExport}
            disabled={isExporting}
            title="Excel eksport"
          >
            <Download size={14} aria-hidden />
            <span>{isExporting ? t('common.loading') : 'Excel'}</span>
          </button>
        </div>
      </div>

      <div className="bc-table-wrap overflow-x-auto -mx-4 sm:-mx-5">
        <table className="bc-table w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-aa-line bg-aa-surface-sunken">
              <th className="px-4 py-2.5 text-xs font-semibold text-aa-ink-muted">{t('platform.billing.collections.colCompany', { defaultValue: 'Kompaniya' })}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-aa-ink-muted">{t('platform.billing.collections.colPlan', { defaultValue: 'Tarif' })}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-aa-ink-muted text-right">{t('platform.billing.collections.colMonthly', { defaultValue: 'Oylik to‘lov' })}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-aa-ink-muted text-right">{t('platform.billing.collections.colBalance', { defaultValue: 'Balans' })}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-aa-ink-muted">{t('platform.billing.collections.colNext', { defaultValue: 'To‘lov muddati' })}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-aa-ink-muted">{t('platform.billing.collections.colStatus', { defaultValue: 'Holati' })}</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-aa-ink-muted text-right">{t('common.actions', { defaultValue: 'Amallar' })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aa-line">
            {listQ.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-aa-ink-muted">{t('common.loading')}</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-aa-ink-muted">
                  {t('platform.billing.collections.reports.noDueCompanies', { defaultValue: 'Qarzdor yoki yaqin kunda to‘lov kutilayotgan kompaniyalar mavjud emas' })}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => (
                <BillingActionableLedgerRow
                  key={row.billing?.companyId || row.companyId || index}
                  row={row}
                  index={index}
                  p={p}
                  t={t}
                  sum={sum}
                  formatDate={formatDate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
