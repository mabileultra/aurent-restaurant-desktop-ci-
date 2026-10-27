import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarClock, Download, Plus, Search } from 'lucide-react';
import { platformBillingApi } from '../../../../api';
import { COLLECTIONS_QUERY_KEY } from '../../hooks/useBillingCollections';
import { STATE_TONE, dueHint, initials } from './billingCollectionsUi';

export default function BillingActionableLedger({ t, money, p }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'DUE_SOON'
  const [search, setSearch] = useState('');

  const currency = t('billing.currency');
  const sum = (v) => `${money(v)} ${currency}`;
  const formatDate = p?.formatDate || ((d) => (d ? new Date(d).toLocaleDateString() : '—'));

  // Fetch all companies to identify overdue and due soon
  const listQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', 'actionable-ledger'],
    queryFn: () => platformBillingApi.collectionsCompanies({}).then((r) => r.data || []),
    staleTime: 60_000,
  });

  const allRows = useMemo(() => (Array.isArray(listQ.data) ? listQ.data : []), [listQ.data]);

  // Filter only companies that need attention: OVERDUE, DUE_SOON, or negative balance
  const dueCompanies = useMemo(() => {
    return allRows.filter((r) => {
      const b = r?.billing || {};
      const isOverdue = r.paymentState === 'OVERDUE' || Number(b.balance) < 0;
      const isDueSoon = r.paymentState === 'DUE_SOON' || (r.daysUntilDue != null && r.daysUntilDue <= 30);
      return isOverdue || isDueSoon;
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
    <div className="bc-card bc-ledger-card">
      <div className="bc-ledger-card__head">
        <div>
          <div className="flex items-center gap-2">
            <span className="bc-report-kpi-card__icon bc-kpi--info">
              <CalendarClock size={16} aria-hidden />
            </span>
            <h3 className="bc-chart-card__title">
              {t('platform.billing.collections.reports.ledgerTitle', { defaultValue: 'Yaqin kunlarda to‘lashi kerak bo‘lganlar va qarzdorlar' })}
            </h3>
          </div>
          <p className="bc-chart-card__sub">
            {t('platform.billing.collections.reports.ledgerSub', { defaultValue: 'Muddati o‘tgan yoki yaqin 30 kun ichida to‘lov kutilayotgan kompaniyalar ro‘yxati' })}
          </p>
        </div>

        <div className="bc-ledger-card__actions flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="bc-ledger-tabs">
            <button
              type="button"
              className={`bc-ledger-tab ${filter === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              {t('common.all', { defaultValue: 'Barchasi' })} ({counts.all})
            </button>
            <button
              type="button"
              className={`bc-ledger-tab bc-ledger-tab--danger ${filter === 'OVERDUE' ? 'is-active' : ''}`}
              onClick={() => setFilter('OVERDUE')}
            >
              <AlertCircle size={13} aria-hidden />
              {t('platform.billing.collections.states.OVERDUE', { defaultValue: 'Qarzdorlar' })} ({counts.overdue})
            </button>
            <button
              type="button"
              className={`bc-ledger-tab bc-ledger-tab--warning ${filter === 'DUE_SOON' ? 'is-active' : ''}`}
              onClick={() => setFilter('DUE_SOON')}
            >
              <CalendarClock size={13} aria-hidden />
              {t('platform.billing.collections.states.DUE_SOON', { defaultValue: 'Tez kunda' })} ({counts.dueSoon})
            </button>
          </div>

          {/* Quick Search */}
          <div className="bc-ledger-search">
            <Search size={14} aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search', { defaultValue: 'Qidiruv…' })}
            />
          </div>

          {/* Export button */}
          <button
            type="button"
            className="bc-btn bc-btn--outline bc-btn--sm"
            onClick={handleExport}
            disabled={isExporting}
            title="Excel eksport"
          >
            <Download size={14} aria-hidden />
            <span>{isExporting ? t('common.loading') : 'Excel'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bc-table-wrap">
        <table className="bc-table">
          <thead>
            <tr>
              <th>{t('platform.billing.collections.colCompany', { defaultValue: 'Kompaniya' })}</th>
              <th>{t('platform.billing.collections.colPlan', { defaultValue: 'Tarif' })}</th>
              <th className="bc-num">{t('platform.billing.collections.colMonthly', { defaultValue: 'Oylik to‘lov' })}</th>
              <th className="bc-num">{t('platform.billing.collections.colBalance', { defaultValue: 'Balans' })}</th>
              <th>{t('platform.billing.collections.colNext', { defaultValue: 'To‘lov muddati' })}</th>
              <th>{t('platform.billing.collections.colStatus', { defaultValue: 'Holati' })}</th>
              <th className="text-right">{t('common.actions', { defaultValue: 'Amallar' })}</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading ? (
              <tr><td colSpan={7} className="bc-table__empty">{t('common.loading')}</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="bc-table__empty py-8 text-center text-slate-400">
                  {t('platform.billing.collections.reports.noDueCompanies', { defaultValue: 'Qarzdor yoki yaqin kunda to‘lov kutilayotgan kompaniyalar mavjud emas' })}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const b = row?.billing || {};
                const companyId = b.companyId || row.companyId || index;
                const hint = dueHint(row, t);
                const isOverdue = row.paymentState === 'OVERDUE' || Number(b.balance) < 0;

                return (
                  <tr
                    key={companyId}
                    className="bc-row hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => p?.selectCompany?.(row)}
                  >
                    <td>
                      <div className="bc-company">
                        <span className={`bc-avatar bc-avatar--${STATE_TONE[row.paymentState] || 'neutral'}`}>
                          {initials(b.companyName)}
                        </span>
                        <span>
                          <span className="bc-company__name">{b.companyName || `#${companyId}`}</span>
                          <span className="bc-company__meta">ID: {companyId}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      {b.planName ? (
                        <span className="bc-pill bc-pill--plan">{b.planName}</span>
                      ) : (
                        <span className="bc-muted">—</span>
                      )}
                    </td>
                    <td className="bc-num font-semibold">{sum(b.monthlyTotal)}</td>
                    <td className={`bc-num font-semibold ${isOverdue ? 'bc-text--danger' : ''}`}>
                      {sum(b.balance)}
                    </td>
                    <td>
                      <span className="bc-date">{formatDate(b.nextChargeAt)}</span>
                      {hint ? (
                        <span className={`bc-sub bc-text--${hint.tone} block text-xs`}>{hint.text}</span>
                      ) : null}
                    </td>
                    <td>
                      <span className={`bc-badge bc-badge--${STATE_TONE[row.paymentState] || 'neutral'}`}>
                        {t(`platform.billing.collections.states.${row.paymentState}`, { defaultValue: row.paymentState })}
                      </span>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="bc-btn bc-btn--primary bc-btn--sm inline-flex items-center gap-1"
                        onClick={() => {
                          p?.openPaymentModal?.(b.companyId, { returnToDrawer: false });
                        }}
                      >
                        <Plus size={13} aria-hidden />
                        <span>{t('platform.billing.collections.addPayment', { defaultValue: 'To‘lov qo‘shish' })}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
