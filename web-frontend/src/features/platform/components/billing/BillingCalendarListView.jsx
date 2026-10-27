import React, { useMemo, useState } from 'react';
import { Calendar, Download, Plus, Search } from 'lucide-react';
import { STATE_TONE, initials } from './billingCollectionsUi';
import { formatDayTitle } from './billingCalendarUtils';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';

export default function BillingCalendarListView({
  t,
  month,
  days = [],
  companyMap = {},
  money,
  currency,
  lang,
  selectedDate = null,
  onClearDateFilter = null,
  onOpenCompany,
  onOpenPaymentModal,
  p,
}) {
  const [search, setSearch] = useState('');

  // Flatten all items across all days of the month
  const allMonthlyItems = useMemo(() => {
    const list = [];
    for (const day of days) {
      for (const item of (day.items || [])) {
        const company = companyMap[item.companyId];
        list.push({
          ...item,
          date: day.date,
          company,
          billing: company?.billing,
          balance: Number(company?.billing?.balance ?? 0),
          regionCode: company?.regionCode,
        });
      }
    }
    return list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [days, companyMap]);

  const regionCodes = useMemo(() => {
    return allMonthlyItems.map((i) => i.regionCode).filter(Boolean);
  }, [allMonthlyItems]);

  const { regionName, districtName } = useGeoNameLookup(regionCodes);

  const filteredItems = useMemo(() => {
    return allMonthlyItems.filter((item) => {
      if (selectedDate && item.date !== selectedDate) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const name = (item.companyName || item.billing?.companyName || '').toLowerCase();
        const id = String(item.companyId || '');
        if (!name.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });
  }, [allMonthlyItems, selectedDate, search]);

  const handleExport = () => {
    p?.actions?.exportExcel?.(false);
  };

  return (
    <div className="bc-card bc-ledger-card">
      <header className="bc-ledger-card__head">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="bc-chart-card__title">
              {t('platform.billing.collections.calendar.monthListTitle', { defaultValue: 'Oylik to‘lovlar va yechishlar jadvali' })}
            </h3>
            {selectedDate && (
              <span className="bc-cal-list-day-chip">
                <Calendar size={13} aria-hidden />
                <span>{formatDayTitle(selectedDate, lang)}</span>
                {onClearDateFilter && (
                  <button
                    type="button"
                    onClick={onClearDateFilter}
                    className="ml-1 hover:opacity-80 text-xs leading-none font-bold cursor-pointer"
                    title={t('platform.billing.collections.calendar.allMonth', { defaultValue: 'Barcha oy' })}
                    aria-label={t('platform.billing.collections.calendar.allMonth', { defaultValue: 'Barcha oy' })}
                  >
                    ✕
                  </button>
                )}
              </span>
            )}
          </div>
          <p className="bc-chart-card__sub">
            {selectedDate
              ? t('platform.billing.collections.calendar.dayListSub', {
                  defaultValue: 'Tanlangan kun uchun to‘lovlar ro‘yxati',
                })
              : t('platform.billing.collections.calendar.monthListSub', {
                  defaultValue: 'Tanlangan oy uchun rejalashtirilgan barcha to‘lovlar ro‘yxati',
                })} ({filteredItems.length})
          </p>
        </div>

        <div className="bc-ledger-card__actions flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="bc-ledger-search">
            <Search size={14} aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search', { defaultValue: 'Qidiruv…' })}
            />
          </div>

          {/* Export */}
          <button
            type="button"
            className="bc-btn bc-btn--outline bc-btn--sm"
            onClick={handleExport}
            disabled={Boolean(p?.actions?.exporting)}
            title="Excel eksport"
          >
            <Download size={14} aria-hidden />
            <span>{p?.actions?.exporting ? t('common.loading', { defaultValue: 'Yuklanmoqda…' }) : 'Excel'}</span>
          </button>
        </div>
      </header>

      <div className="bc-table-wrap">
        <table className="bc-table">
          <thead>
            <tr>
              <th>{t('platform.billing.collections.colNext', { defaultValue: 'Yechish sanasi' })}</th>
              <th>{t('platform.billing.collections.colCompany', { defaultValue: 'Kompaniya' })}</th>
              <th>{t('geo.region', { defaultValue: 'Hudud' })}</th>
              <th>{t('platform.billing.collections.colPlan', { defaultValue: 'Tarif' })}</th>
              <th className="bc-num">{t('platform.billing.collections.colMonthly', { defaultValue: 'Yechiladigan summa' })}</th>
              <th className="bc-num">{t('platform.billing.collections.colBalance', { defaultValue: 'Balans' })}</th>
              <th>{t('platform.billing.collections.colStatus', { defaultValue: 'Holati' })}</th>
              <th className="text-right">{t('common.actions', { defaultValue: 'Amallar' })}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="bc-table__empty py-8 text-center text-slate-400">
                  {t('platform.billing.emptyCompanies', { defaultValue: 'Kompaniyalar topilmadi' })}
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const b = item.billing;
                const name = item.companyName || b?.companyName || `#${item.companyId}`;
                const isOverdue = item.paymentState === 'OVERDUE' || item.balance < 0;
                const region = item.regionCode ? regionName(item.regionCode) : '—';
                const stateTone = STATE_TONE[item.paymentState] || 'neutral';

                return (
                  <tr
                    key={`${item.companyId}-${item.date}-${idx}`}
                    className="bc-row hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => onOpenCompany(item.companyId, item.company)}
                  >
                    <td>
                      <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                        {formatDayTitle(item.date, lang)}
                      </span>
                    </td>
                    <td>
                      <div className="bc-company">
                        <span className={`bc-avatar bc-avatar--${stateTone}`}>
                          {initials(name)}
                        </span>
                        <span>
                          <span className="bc-company__name">{name}</span>
                          <span className="bc-company__meta">ID: {item.companyId}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 dark:text-slate-300">{region}</span>
                    </td>
                    <td>
                      {b?.planName ? (
                        <span className="bc-pill bc-pill--plan">{b.planName}</span>
                      ) : (
                        <span className="bc-muted">—</span>
                      )}
                    </td>
                    <td className="bc-num font-semibold">
                      {money(item.amount)} {currency}
                    </td>
                    <td className={`bc-num font-semibold ${isOverdue ? 'bc-text--danger' : ''}`}>
                      {money(item.balance)} {currency}
                    </td>
                    <td>
                      <span className={`bc-badge bc-badge--${stateTone}`}>
                        {t(`platform.billing.collections.states.${item.paymentState}`, { defaultValue: item.paymentState })}
                      </span>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="bc-btn bc-btn--primary bc-btn--sm inline-flex items-center gap-1"
                        onClick={() => {
                          onOpenPaymentModal(item.companyId);
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
