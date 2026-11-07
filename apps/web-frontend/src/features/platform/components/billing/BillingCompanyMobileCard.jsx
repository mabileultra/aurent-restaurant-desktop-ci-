import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';
import {
  STATE_TONE,
  activeDeferralDay,
  balanceTone,
  dueHint,
  initials,
} from './billingCollectionsUi';

export default function BillingCompanyMobileCard({
  row,
  p,
  c,
  regionName,
  districtName,
  k,
  currency,
}) {
  const { money, formatDate, t } = p;
  const b = row.billing || {};
  const isSelected = p.selectedCompanyId === b.companyId;
  const hint = dueHint(row, t);
  const paymentState = row.paymentState || 'NOT_BILLED';
  const deferral = activeDeferralDay(b);

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none bg-white dark:!bg-slate-900 ${
        isSelected
          ? 'border-emerald-500 shadow-sm bg-emerald-50/20 dark:bg-emerald-950/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
      onClick={() => p.selectCompany(row)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          p.selectCompany(row);
        }
      }}
    >
      {/* Top Header: Checkbox, Name, Status Badge */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5">
        <div className="flex items-start space-x-2.5 min-w-0">
          <div
            className="pt-0.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <BaseCheckbox
              checked={c.selectedIds.has(b.companyId)}
              onChange={() => c.toggleSelect(b.companyId)}
              ariaLabel={b.companyName}
              size={18}
            />
          </div>
          <div className="flex items-center space-x-2 min-w-0">
            <span
              className={`bc-avatar bc-avatar--${STATE_TONE[paymentState]} shrink-0 w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center`}
            >
              {initials(b.companyName)}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                {b.companyName || `#${b.companyId}`}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                ID: {b.companyId}
                {row.newCompany ? (
                  <span className="bc-new ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                    {k('newBadge')}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center space-x-1">
          <span className={`bc-badge bc-badge--${STATE_TONE[paymentState]} text-[11px]`}>
            {k(`states.${paymentState}`)}
          </span>
          <ChevronRight size={16} className="text-slate-400" aria-hidden />
        </div>
      </div>

      {/* Financials & Status Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">{k('currentBalance')}</span>
          <p className={`font-bold tabular-nums text-sm bc-text--${balanceTone(b.balance)}`}>
            {money(b.balance)} {currency}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">{k('colMonthly')}</span>
          <p className="font-semibold tabular-nums text-sm text-slate-800 dark:text-slate-200">
            {money(b.monthlyTotal)} {currency}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">{k('colPlan')}</span>
          <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
            {b.planName || (Number(b.monthlyTotal) > 0 ? k('customPlan') : '—')}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">{k('colNext')}</span>
          <p className="font-medium text-slate-700 dark:text-slate-300">
            {formatDate(b.nextChargeAt)}
          </p>
          {hint ? <span className={`text-[10px] bc-text--${hint.tone}`}>{hint.text}</span> : null}
        </div>
      </div>

      {deferral ? (
        <div className="mt-2 text-[11px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-1 rounded">
          {k('deferral.until', { date: formatDate(deferral) })}
        </div>
      ) : null}
    </div>
  );
}
