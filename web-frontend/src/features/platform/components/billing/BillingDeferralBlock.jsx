import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { shiftIsoDate, toIsoDate } from '../BillingPeriodCalendar';
import { activeDeferralDay } from './billingCollectionsUi';

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
      <div className="bc-deferral bc-deferral--active">
        <p className="bc-deferral__title">
          <CalendarClock size={16} aria-hidden />
          {k('activeUntil', { date: formatDate(active) })}
        </p>
        {b.deferralReason ? <p className="bc-sub">{k('reasonLabel')}: {b.deferralReason}</p> : null}
        <button type="button" className="bc-btn bc-btn--danger-outline" disabled={p.deferralBusy} onClick={p.cancelDeferral}>
          {k('cancel')}
        </button>
      </div>
    );
  }

  return (
    <div className="bc-deferral">
      <p className="bc-deferral__title"><CalendarClock size={16} aria-hidden />{k('title')}</p>
      <p className="bc-sub">{k('hint')}</p>
      <div className="bc-deferral__quick">
        {QUICK_DAYS.map((d) => (
          <button key={d} type="button" className="bc-btn bc-btn--outline" onClick={() => setUntil(shiftIsoDate(today, d))}>
            {k('plusDays', { count: d })}
          </button>
        ))}
      </div>
      <div className="bc-deferral__row">
        <input type="date" className="bc-control" min={tomorrow} value={until} onChange={(e) => setUntil(e.target.value)} />
        <input
          className="bc-control"
          value={reason}
          maxLength={255}
          onChange={(e) => setReason(e.target.value)}
          placeholder={k('reasonPlaceholder')}
        />
      </div>
      <button
        type="button"
        className="bc-btn bc-btn--primary"
        disabled={p.deferralBusy || !until || until < tomorrow}
        onClick={() => p.grantDeferral({ until, reason })}
      >
        {k('grant', { date: until ? formatDate(`${until}T00:00:00`) : '' })}
      </button>
    </div>
  );
}
