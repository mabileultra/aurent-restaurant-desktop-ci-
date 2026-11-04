import React from 'react';

export default function BillingCalendarDailyTabs({ tab, setTab, counts, k }) {
  return (
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
  );
}
