import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Plus, User } from 'lucide-react';
import { STATE_TONE, dueHint, initials } from './billingCollectionsUi';
import { formatDayTitle, shiftDay } from './billingCalendarUtils';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';

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
  const [tab, setTab] = useState('ALL'); // 'ALL' | 'SUCCESS' | 'LOW_BALANCE' | 'OTHER'

  const rawItems = dayData?.items || [];

  // Lookup region codes for display
  const regionCodes = useMemo(() => {
    return rawItems
      .map((it) => companyMap[it.companyId]?.regionCode)
      .filter(Boolean);
  }, [rawItems, companyMap]);

  const { regionName, districtName } = useGeoNameLookup(regionCodes);

  // Compute stats and enrich items
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
      const isOverdue = item.paymentState === 'OVERDUE' || balance < 0;
      const hasDeferral = Boolean(b?.deferralUntil);
      const isLowBalance = isOverdue || (balance < amt && item.paymentState !== 'ACTIVE');

      let category = 'PLANNED';
      if (item.paymentState === 'SUSPENDED') {
        category = 'SUSPENDED';
        suspended++;
      } else if (hasDeferral) {
        category = 'DEFERRAL';
        deferral++;
      } else if (isLowBalance) {
        category = 'LOW_BALANCE';
        lowBal++;
      } else if (item.paymentState === 'ACTIVE') {
        category = 'SUCCESS';
        success++;
      } else {
        category = 'PLANNED';
        planned++;
      }

      return {
        ...item,
        company,
        billing: b,
        balance,
        hasDeferral,
        isLowBalance,
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
  }, [rawItems, companyMap]);

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
              className="bc-icon-btn bc-icon-btn--circle"
              onClick={() => setPicked(shiftDay(picked, -1))}
              title={t('common.prev', { defaultValue: 'Oldingi kun' })}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="bc-icon-btn bc-icon-btn--circle"
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
          <div className="bc-cal-side-tabs">
            <button
              type="button"
              className={`bc-cal-side-tab ${tab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setTab('ALL')}
            >
              {k('tabAll', { defaultValue: 'Barchasi' })} ({counts.all})
            </button>
            {counts.success > 0 && (
              <button
                type="button"
                className={`bc-cal-side-tab bc-cal-side-tab--success ${tab === 'SUCCESS' ? 'is-active' : ''}`}
                onClick={() => setTab('SUCCESS')}
              >
                {k('tabSuccess', { defaultValue: 'Muvaffaqiyatli' })} ({counts.success})
              </button>
            )}
            {counts.lowBalance > 0 && (
              <button
                type="button"
                className={`bc-cal-side-tab bc-cal-side-tab--danger ${tab === 'LOW_BALANCE' ? 'is-active' : ''}`}
                onClick={() => setTab('LOW_BALANCE')}
              >
                {k('tabLowBalance', { defaultValue: 'Yetishmovchilik' })} ({counts.lowBalance})
              </button>
            )}
            {counts.deferral > 0 && (
              <button
                type="button"
                className={`bc-cal-side-tab bc-cal-side-tab--warning ${tab === 'DEFERRAL' ? 'is-active' : ''}`}
                onClick={() => setTab('DEFERRAL')}
              >
                {k('tabDeferral', { defaultValue: 'Kechiktirilgan' })} ({counts.deferral})
              </button>
            )}
            {counts.planned > 0 && (
              <button
                type="button"
                className={`bc-cal-side-tab bc-cal-side-tab--info ${tab === 'PLANNED' ? 'is-active' : ''}`}
                onClick={() => setTab('PLANNED')}
              >
                {k('tabPlanned', { defaultValue: 'Kutilmoqda' })} ({counts.planned})
              </button>
            )}
            {counts.suspended > 0 && (
              <button
                type="button"
                className={`bc-cal-side-tab bc-cal-side-tab--neutral ${tab === 'SUSPENDED' ? 'is-active' : ''}`}
                onClick={() => setTab('SUSPENDED')}
              >
                {k('tabSuspended', { defaultValue: 'To‘xtatilgan' })} ({counts.suspended})
              </button>
            )}
          </div>
        )}
      </header>

      {/* Body: Companies Cards */}
      <div className="bc-cal-side-panel__body">
        {filteredItems.length === 0 ? (
          <div className="bc-cal-side-panel__empty">
            <p className="text-xs text-slate-400 py-8 text-center">
              {enrichedItems.length === 0
                ? k('noPayments', { defaultValue: 'Bu kunda yechish kutilmaydi' })
                : t('platform.billing.emptyCompanies', { defaultValue: 'Bu filtr bo‘yicha kompaniyalar topilmadi' })}
            </p>
          </div>
        ) : (
          <ul className="bc-cal-companies-list">
            {filteredItems.map((item, idx) => {
              const comp = item.company;
              const b = item.billing;
              const name = item.companyName || b?.companyName || `#${item.companyId}`;
              const plan = b?.planName || t('platform.billing.collections.customPlan', { defaultValue: 'Individual' });
              const region = comp?.regionCode ? regionName(comp.regionCode) : '';
              const state = item.paymentState;
              const stateTone = STATE_TONE[state] || 'neutral';

              return (
                <li key={`${item.companyId}-${item.amount || 0}-${idx}`} className="bc-cal-company-item">
                  <div
                    className="bc-cal-company-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenCompany(item.companyId, comp)}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenCompany(item.companyId, comp)}
                  >
                    {/* Avatar */}
                    <div className={`bc-cal-company-avatar bc-avatar--${stateTone}`}>
                      {initials(name)}
                    </div>

                    {/* Middle details */}
                    <div className="bc-cal-company-info">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bc-cal-company-name" title={name}>
                          {name}
                        </span>
                        <span className={`bc-badge bc-badge--${stateTone} text-[10px]`}>
                          {t(`platform.billing.collections.states.${state}`, { defaultValue: state })}
                        </span>
                      </div>

                      <div className="bc-cal-company-meta">
                        <span>ID: {item.companyId}</span>
                        {comp?.companyTin ? (
                          <>
                            <span className="bc-dot-sep">·</span>
                            <span>STIR: {comp.companyTin}</span>
                          </>
                        ) : null}
                        {region ? (
                          <>
                            <span className="bc-dot-sep">·</span>
                            <span>{region}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="bc-cal-company-plan">
                        <span>{t('platform.billing.collections.colPlan', { defaultValue: 'Tarif' })}: <strong>{plan}</strong></span>
                      </div>
                    </div>

                    {/* Right side: Amount & Balance */}
                    <div className="bc-cal-company-financials">
                      <div className="bc-cal-company-amount font-bold">
                        {money(item.amount)} {currency}
                      </div>
                      <div className={`bc-cal-company-balance ${item.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        {k('balanceLabel', {
                          amount: money(item.balance),
                          currency,
                          defaultValue: `Balans: ${money(item.balance)} ${currency}`,
                        })}
                      </div>
                      <div className="bc-cal-company-arrow">
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer: Action button to open full list or quick payment */}
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
              defaultValue: `${dayTitle} dagi kompaniyalar ro‘yxatini ochish`,
            })}
          </span>
        </button>
      </footer>
    </aside>
  );
}
