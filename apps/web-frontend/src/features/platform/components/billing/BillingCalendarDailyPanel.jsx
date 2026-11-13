import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { classifyCalendarItem, formatDayTitle, shiftDay } from './billingCalendarUtils';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import BillingCalendarDailyCompanyRow from './BillingCalendarDailyCompanyRow';
import BillingCalendarDailyTabs from './BillingCalendarDailyTabs';

export default function BillingCalendarDailyPanel({
  t,
  picked,
  setPicked,
  dayData,
  companyMap = {},
  money,
  currency,
  lang,
  onOpenCompany,
  onOpenPaymentModal,
  onSwitchToList,
}) {
  const k = (key, opts) => t(`platform.billing.collections.calendar.${key}`, opts);
  const [tab, setTab] = useState('ALL');

  const rawItems = dayData?.items || [];
  const todayIso = new Date().toLocaleDateString('sv-SE');
  const isFuture = Boolean(picked && picked > todayIso);

  // Lookup region codes for display
  const regionCodes = useMemo(() => {
    return rawItems
      .map((it) => companyMap[it.companyId]?.regionCode)
      .filter(Boolean);
  }, [rawItems, companyMap]);

  const { regionName } = useGeoNameLookup(regionCodes);

  // Compute stats and enrich items using single source of truth
  const { enrichedItems, counts, totalAmount } = useMemo(() => {
    let sum = 0;
    let success = 0;
    let lowBal = 0;
    let deferral = 0;
    let planned = 0;
    let suspended = 0;

    const list = rawItems.map((item) => {
      const amt = Number(item.amount || 0);
      sum += amt;

      const company = companyMap[item.companyId];
      const b = company?.billing;
      const balance = Number(b?.balance ?? 0);
      const category = classifyCalendarItem(item, company, isFuture);

      if (category === 'SUSPENDED') suspended++;
      else if (category === 'DEFERRAL') deferral++;
      else if (category === 'LOW_BALANCE') lowBal++;
      else if (category === 'SUCCESS') success++;
      else planned++;

      return {
        ...item,
        company,
        billing: b,
        balance,
        category,
      };
    });

    return {
      enrichedItems: list,
      counts: {
        all: list.length,
        success,
        lowBalance: lowBal,
        deferral,
        planned,
        suspended,
      },
      totalAmount: sum,
    };
  }, [rawItems, companyMap, isFuture]);

  const filteredItems = useMemo(() => {
    if (tab === 'ALL') return enrichedItems;
    return enrichedItems.filter((i) => i.category === tab);
  }, [enrichedItems, tab]);

  const dayTitle = formatDayTitle(picked, lang);

  return (
    <aside className="bc-card bc-cal-side-panel">
      {/* Header with Date Navigation */}
      <header className="bc-cal-side-panel__head">
        <div className="flex items-center justify-between">
          <h3 className="bc-cal-side-panel__title">{dayTitle}</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-8 h-8 inline-flex items-center justify-center rounded-aa-sm border border-aa-line text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-sunken transition-colors"
              onClick={() => setPicked(shiftDay(picked, -1))}
              title={t('common.prev', { defaultValue: 'Oldingi kun' })}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="w-8 h-8 inline-flex items-center justify-center rounded-aa-sm border border-aa-line text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-sunken transition-colors"
              onClick={() => setPicked(shiftDay(picked, 1))}
              title={t('common.next', { defaultValue: 'Keyingi kun' })}
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>

        <div className="bc-cal-side-panel__meta">
          <span className="bc-cal-side-panel__count">
            {k('dailyTotal', {
              count: enrichedItems.length,
              amount: money(totalAmount),
              currency,
              defaultValue: `${enrichedItems.length} ta yechish · ${money(totalAmount)} ${currency}`,
            })}
          </span>
        </div>

        {/* Filter Pills Tabs */}
        {enrichedItems.length > 0 && (
          <BillingCalendarDailyTabs
            tab={tab}
            setTab={setTab}
            counts={counts}
            k={k}
          />
        )}
      </header>

      {/* Body: Companies Cards */}
      <div className="bc-cal-side-panel__body">
        {filteredItems.length === 0 ? (
          <div className="bc-cal-side-panel__empty">
            <p className="text-xs text-aa-ink-muted py-8 text-center">
              {enrichedItems.length === 0
                ? k('noPayments', { defaultValue: 'Bu kunda yechish kutilmaydi' })
                : t('platform.billing.emptyCompanies', { defaultValue: 'Bu filtr bo‘yicha kompaniyalar topilmadi' })}
            </p>
          </div>
        ) : (
          <ul className="bc-cal-companies-list">
            {filteredItems.map((item, idx) => (
              <BillingCalendarDailyCompanyRow
                key={`${item.companyId}-${item.amount || 0}-${idx}`}
                item={item}
                company={item.company}
                billing={item.billing}
                regionName={regionName}
                isFuture={isFuture}
                money={money}
                currency={currency}
                t={t}
                k={k}
                onOpenCompany={onOpenCompany}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer: Action button */}
      <footer className="bc-cal-side-panel__footer">
        <button
          type="button"
          className="bc-btn bc-btn--outline w-full justify-center text-xs"
          onClick={() => onSwitchToList?.(picked)}
        >
          <FileSpreadsheet size={14} aria-hidden />
          <span>
            {k('openDayList', {
              date: dayTitle,
              defaultValue: `${dayTitle} dagi barcha kompaniyalar ro‘yxati`,
            })}
          </span>
        </button>
      </footer>
    </aside>
  );
}
