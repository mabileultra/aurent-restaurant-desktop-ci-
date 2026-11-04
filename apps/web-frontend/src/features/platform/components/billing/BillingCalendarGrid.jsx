import React from 'react';
import { Info } from 'lucide-react';
import { buildMonthGrid, formatDayTitle, getDayStatusInfo, monthKey } from './billingCalendarUtils';

export default function BillingCalendarGrid({
  t,
  month,
  setMonth,
  picked,
  setPicked,
  byDate = {},
  companyMap = {},
  money,
  lang,
}) {
  const k = (key, opts) => t(`platform.billing.collections.calendar.${key}`, opts);
  const todayIso = new Date().toLocaleDateString('sv-SE');
  const cells = buildMonthGrid(month);

  const WEEKDAYS = lang?.startsWith('uz')
    ? ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
    : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="bc-card bc-calendar-main-card">
      {/* 7-column Calendar Grid */}
      <div className="bc-cal-grid-wrap">
        {/* Weekday headers */}
        <div className="bc-cal-weekdays">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="bc-cal-weekday">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="bc-cal-grid">
          {cells.map((cell) => {
            const { iso, dayNum, isOtherMonth, isPrevMonth, isNextMonth } = cell;
            const dayData = byDate[iso];
            const items = dayData?.items || [];
            const info = items.length > 0 ? getDayStatusInfo(items, companyMap) : null;

            const isToday = iso === todayIso;
            const isPicked = iso === picked;

            const cellClasses = [
              'bc-cal-cell',
              isOtherMonth ? 'bc-cal-cell--other' : '',
              isToday ? 'bc-cal-cell--today' : '',
              isPicked ? 'bc-cal-cell--picked' : '',
              info ? 'bc-cal-cell--has-data' : '',
            ].filter(Boolean).join(' ');

            const handleClick = () => {
              if (isOtherMonth) {
                setMonth(monthKey(iso));
              }
              setPicked(iso);
            };

            const titleText = `${formatDayTitle(iso, lang)}${info ? `: ${info.count} ta to‘lov, ${money(info.amount)}` : ''}`;

            return (
              <button
                key={iso}
                type="button"
                className={cellClasses}
                onClick={handleClick}
                aria-pressed={isPicked}
                aria-label={titleText}
                title={titleText}
              >
                <div className="bc-cal-cell__head">
                  <span className={`bc-cal-cell__day ${isToday ? 'bc-cal-cell__day--today' : ''}`}>
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="bc-cal-cell__today-tag">
                      {k('today', { defaultValue: 'Bugun' })}
                    </span>
                  )}
                </div>

                <div className="bc-cal-cell__body">
                  {info ? (
                    <div className={`bc-cal-cell__badge bc-cal-cell__badge--${info.tone}`}>
                      <span className={`bc-cal-cell__dot bc-cal-cell__dot--${info.tone}`} />
                      <span className="bc-cal-cell__badge-count">{info.count}</span>
                      <span className="bc-cal-cell__badge-sep">·</span>
                      <span className="bc-cal-cell__badge-sum">
                        {money(info.amount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <footer className="bc-cal-legend">
        <div className="bc-cal-legend__items">
          <div className="bc-cal-legend__item">
            <span className="bc-cal-legend__dot bc-cal-legend__dot--success" />
            <span>{k('legendSuccess', { defaultValue: 'Yechildi (muvaffaqiyatli)' })}</span>
          </div>
          <div className="bc-cal-legend__item">
            <span className="bc-cal-legend__dot bc-cal-legend__dot--info" />
            <span>{k('legendPlanned', { defaultValue: 'Rejalashtirilgan' })}</span>
          </div>
          <div className="bc-cal-legend__item">
            <span className="bc-cal-legend__dot bc-cal-legend__dot--warning" />
            <span>{k('legendDeferral', { defaultValue: 'Kechiktirish' })}</span>
          </div>
          <div className="bc-cal-legend__item">
            <span className="bc-cal-legend__dot bc-cal-legend__dot--danger" />
            <span>{k('legendLowBalance', { defaultValue: 'Balans yetmaydi / Qarzdor' })}</span>
          </div>
          <div className="bc-cal-legend__item">
            <span className="bc-cal-legend__dot bc-cal-legend__dot--neutral" />
            <span>{k('legendSuspended', { defaultValue: 'To‘xtatilgan' })}</span>
          </div>
        </div>

        <div className="bc-cal-legend__hint">
          <Info size={13} aria-hidden />
          <span>{k('legendHint', { defaultValue: 'Billing sanasi bo‘yicha kutilayotgan to‘lovlar ko‘rsatilgan.' })}</span>
        </div>
      </footer>
    </div>
  );
}
