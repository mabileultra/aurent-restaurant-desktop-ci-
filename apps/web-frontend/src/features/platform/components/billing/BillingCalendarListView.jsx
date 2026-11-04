import React, { useMemo } from 'react';
import { Calendar, Download } from 'lucide-react';
import { formatDayTitle } from './billingCalendarUtils';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import BillingCalendarListRow from './BillingCalendarListRow';

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
  const todayIso = new Date().toLocaleDateString('sv-SE');

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

  const { regionName } = useGeoNameLookup(regionCodes);

  const filteredItems = useMemo(() => {
    if (!selectedDate) return allMonthlyItems;
    return allMonthlyItems.filter((item) => item.date === selectedDate);
  }, [allMonthlyItems, selectedDate]);

  const isExporting = Boolean(p?.actions?.exporting);
  const handleExport = () => {
    p?.actions?.exportExcel?.(false);
  };

  return (
    <div className="bc-card bc-ledger-card bc-calendar-list-view">
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
          <button
            type="button"
            className="bc-btn bc-btn--outline bc-btn--sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download size={14} aria-hidden />
            <span>Excel</span>
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="bc-table-wrap">
        <table className="bc-table">
          <thead>
            <tr>
              <th>{t('platform.billing.collections.calendar.colDate', { defaultValue: 'Yechish sanasi' })}</th>
              <th>{t('platform.billing.collections.colCompany', { defaultValue: 'Kompaniya' })}</th>
              <th>{t('geo.region', { defaultValue: 'Viloyat' })}</th>
              <th>{t('platform.billing.collections.colPlan', { defaultValue: 'Tarif' })}</th>
              <th className="bc-num">{t('platform.billing.collections.colMonthly', { defaultValue: 'Yechish summasi' })}</th>
              <th className="bc-num">{t('platform.billing.collections.colBalance', { defaultValue: 'Balans' })}</th>
              <th>{t('platform.billing.collections.colStatus', { defaultValue: 'Holati' })}</th>
              <th className="text-right">{t('platform.billing.collections.colActions', { defaultValue: 'Amallar' })}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="bc-table__empty text-xs text-slate-400 text-center py-10">
                  {t('platform.billing.emptyCompanies', { defaultValue: 'Kompaniyalar topilmadi' })}
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <BillingCalendarListRow
                  key={`${item.companyId}-${item.date}-${idx}`}
                  item={item}
                  todayIso={todayIso}
                  regionName={regionName}
                  lang={lang}
                  money={money}
                  currency={currency}
                  t={t}
                  onOpenCompany={onOpenCompany}
                  onOpenPaymentModal={onOpenPaymentModal}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
