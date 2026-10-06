import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { platformBillingApi } from '../../../../api';
import { COLLECTIONS_QUERY_KEY } from '../../hooks/useBillingCollections';
import { STATE_TONE } from './billingCollectionsUi';

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

function buildGrid(key) {
  const [y, m] = key.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(y, m, 0).getDate();
  const cells = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d += 1) {
    cells.push(`${key}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export default function BillingCalendarView({ t, money, dateLocale, onOpenCompany }) {
  const todayIso = new Date().toLocaleDateString('sv-SE');
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [picked, setPicked] = useState(todayIso);
  const k = (key, opts) => t(`platform.billing.collections.calendar.${key}`, opts);
  const currency = t('billing.currency');

  const q = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'calendar', month],
    queryFn: () => platformBillingApi.collectionsCalendar({ month }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const byDate = useMemo(
    () => Object.fromEntries((q.data?.days || []).map((d) => [d.date, d])),
    [q.data],
  );
  const cells = useMemo(() => buildGrid(month), [month]);
  const weekdays = t('platform.billing.calendarWeekdays', { returnObjects: true });
  const [y, m] = month.split('-').map(Number);
  const title = new Date(y, m - 1, 1).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });
  const day = byDate[picked];

  return (
    <div className="bc-calendar-layout">
      <section className="bc-card bc-calendar">
        <header className="bc-calendar__head">
          <button type="button" className="bc-icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label={t('platform.billing.calendarPrev')}>
            <ChevronLeft size={18} />
          </button>
          <h3>{title}</h3>
          <button type="button" className="bc-icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label={t('platform.billing.calendarNext')}>
            <ChevronRight size={18} />
          </button>
          <span className="bc-calendar__total">
            {k('monthTotal', { count: q.data?.totalCount ?? 0, amount: money(q.data?.totalAmount), currency })}
          </span>
        </header>
        <div className="bc-calendar__grid">
          {Array.isArray(weekdays) ? weekdays.map((w) => <span key={w} className="bc-calendar__wd">{w}</span>) : null}
          {cells.map((iso, i) => {
            if (!iso) return <span key={`e${i}`} className="bc-calendar__cell bc-calendar__cell--empty" />;
            const info = byDate[iso];
            const cls = [
              'bc-calendar__cell',
              iso === todayIso ? 'bc-calendar__cell--today' : '',
              iso === picked ? 'bc-calendar__cell--picked' : '',
              info ? 'bc-calendar__cell--busy' : '',
            ].filter(Boolean).join(' ');
            return (
              <button key={iso} type="button" className={cls} onClick={() => setPicked(iso)}>
                <span className="bc-calendar__num">{Number(iso.slice(-2))}</span>
                {info ? <span className="bc-calendar__dot">● {info.count}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bc-card bc-side">
        <h3 className="bc-side__title">
          {new Date(`${picked}T00:00:00`).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' })}
        </h3>
        {day ? (
          <>
            <p className="bc-sub">{k('expectedCount', { count: day.count })}</p>
            <p className="bc-calendar__sum">{money(day.amount)} {currency}</p>
            <ul className="bc-side__list">
              {day.items.map((item) => (
                <li key={item.companyId}>
                  <button type="button" className="bc-side__item" onClick={() => onOpenCompany(item.companyId)}>
                    <span className="min-w-0 flex-1">
                      <span className="bc-company__name">{item.companyName || `#${item.companyId}`}</span>
                      <span className="bc-sub">{money(item.amount)} {currency}</span>
                    </span>
                    <span className={`bc-badge bc-badge--${STATE_TONE[item.paymentState]}`}>
                      {t(`platform.billing.collections.states.${item.paymentState}`)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="bc-muted">{k('noPayments')}</p>
        )}
      </section>
    </div>
  );
}
