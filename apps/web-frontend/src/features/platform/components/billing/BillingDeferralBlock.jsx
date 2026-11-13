import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { shiftIsoDate, toIsoDate } from '../BillingPeriodCalendar';
import { activeDeferralDay } from './billingCollectionsUi';
import PlatformDatePicker from '../PlatformDatePicker';

const QUICK_DAYS = [3, 7, 14, 30];

export default function BillingDeferralBlock({ p }) {
  const { t, selected: b, formatDate } = p;
  const k = (key, opts) => t(`platform.billing.collections.deferral.${key}`, opts);
  const today = toIsoDate(new Date());
  const tomorrow = shiftIsoDate(today, 1);
  const [until, setUntil] = useState(() => shiftIsoDate(today, 7));
  const [reason, setReason] = useState('');
  const active = activeDeferralDay(b);

  if (active) {
    return (
      <div className="bc-deferral bc-deferral--active rounded-aa-lg border border-aa-line bg-aa-surface p-4">
        <p className="bc-deferral__title text-xs font-semibold text-aa-ink flex items-center gap-2">
          <CalendarClock size={16} className="text-aa-ink-muted" aria-hidden />
          {k('activeUntil', { date: formatDate(active) })}
        </p>
        {b.deferralReason ? <p className="text-xs text-aa-ink-muted mt-1">{k('reasonLabel')}: {b.deferralReason}</p> : null}
        <button type="button" className="aa-btn aa-btn--danger aa-size-sm mt-3" disabled={p.deferralBusy} onClick={p.cancelDeferral}>
          {k('cancel')}
        </button>
      </div>
    );
  }

  return (
    <div className="bc-deferral rounded-aa-lg border border-aa-line bg-aa-surface p-4">
      <p className="bc-deferral__title text-xs font-semibold text-aa-ink flex items-center gap-2">
        <CalendarClock size={16} className="text-aa-ink-muted" aria-hidden />
        {k('title')}
      </p>
      <p className="text-xs text-aa-ink-muted mt-1">{k('hint')}</p>
      <div className="bc-deferral__quick flex flex-wrap gap-1.5 my-3">
        {QUICK_DAYS.map((d) => (
          <button key={d} type="button" className="aa-btn aa-btn--secondary aa-size-sm" onClick={() => setUntil(shiftIsoDate(today, d))}>
            {k('plusDays', { count: d })}
          </button>
        ))}
      </div>
      <div className="bc-deferral__row flex flex-col sm:flex-row gap-2 my-3">
        <div className="flex-1">
          <PlatformDatePicker
            min={tomorrow}
            value={until}
            onChange={setUntil}
            quickDays={false}
            className="w-full"
            variant="aa"
            t={t}
          />
        </div>
        <input
          className="flex-1 h-10 sm:h-10 h-11 px-3 text-xs sm:text-xs text-sm rounded-aa-md border border-aa-line-strong bg-aa-surface text-aa-ink placeholder:text-aa-ink-subtle focus:outline-none focus:ring-1 focus:ring-aa-primary"
          value={reason}
          maxLength={255}
          onChange={(e) => setReason(e.target.value)}
          placeholder={k('reasonPlaceholder')}
        />
      </div>
      <button
        type="button"
        className="aa-btn aa-btn--primary aa-size-md w-full sm:w-auto"
        disabled={p.deferralBusy || !until || until < tomorrow}
        onClick={() => p.grantDeferral({ until, reason })}
      >
        {k('grant', { date: until ? formatDate(`${until}T00:00:00`) : '' })}
      </button>
    </div>
  );
}
