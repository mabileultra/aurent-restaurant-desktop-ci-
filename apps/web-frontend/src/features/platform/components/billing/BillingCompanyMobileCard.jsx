import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';
import {
  activeDeferralDay,
  balanceTone,
  dueHint,
  initials,
} from './billingCollectionsUi';

function getMobileStatusBadge(state, label) {
  let cls = 'bg-aa-surface-sunken text-aa-ink-muted border-aa-line';
  if (state === 'ACTIVE') {
    cls = 'bg-aa-success-soft text-aa-success border-aa-line';
  } else if (state === 'NOT_BILLED') {
    cls = 'bg-aa-brand-soft text-aa-brand border-aa-line';
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

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
      className={`p-3.5 rounded-aa-lg border transition-all cursor-pointer select-none bg-aa-surface ${
        isSelected
          ? 'border-aa-brand ring-1 ring-aa-brand bg-aa-surface-selected shadow-none'
          : 'border-aa-line hover:border-aa-line-strong'
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
            className="pt-0.5 min-h-[44px] flex items-center"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <BaseCheckbox
              variant="aa"
              checked={c.selectedIds.has(b.companyId)}
              onChange={() => c.toggleSelect(b.companyId)}
              ariaLabel={b.companyName}
              size={18}
            />
          </div>
          <div className="flex items-center space-x-2 min-w-0">
            <span
              className="shrink-0 w-8 h-8 rounded-aa-sm bg-aa-surface-sunken text-aa-ink-muted border border-aa-line text-xs font-semibold flex items-center justify-center"
            >
              {initials(b.companyName)}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-aa-ink truncate leading-tight">
                {b.companyName || `#${b.companyId}`}
              </h4>
              <p className="text-xs text-aa-ink-muted mt-0.5 truncate">
                ID: <span className="font-mono">{b.companyId}</span>
                {row.newCompany ? (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-aa-sm text-xs font-semibold bg-aa-brand-soft text-aa-brand border border-aa-line">
                    {k('newBadge')}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center space-x-1">
          {getMobileStatusBadge(paymentState, k(`states.${paymentState}`))}
          <div className="w-8 h-8 flex items-center justify-center rounded-aa-sm text-aa-ink-muted">
            <ChevronRight size={16} aria-hidden />
          </div>
        </div>
      </div>

      {/* Financials & Status Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-aa-line text-xs">
        <div>
          <span className="text-xs text-aa-ink-muted font-medium">{k('currentBalance')}</span>
          <p className={`font-bold tabular-nums text-sm ${balanceTone(b.balance) === 'danger' ? 'text-aa-danger' : balanceTone(b.balance) === 'warning' ? 'text-aa-warning' : 'text-aa-ink'}`}>
            {money(b.balance)} {currency}
          </p>
        </div>
        <div>
          <span className="text-xs text-aa-ink-muted font-medium">{k('colMonthly')}</span>
          <p className="font-semibold tabular-nums text-sm text-aa-ink">
            {money(b.monthlyTotal)} {currency}
          </p>
        </div>
        <div>
          <span className="text-xs text-aa-ink-muted font-medium">{k('colPlan')}</span>
          <p className="font-medium text-aa-ink truncate mt-0.5">
            {b.planName || (Number(b.monthlyTotal) > 0 ? k('customPlan') : '—')}
          </p>
        </div>
        <div>
          <span className="text-xs text-aa-ink-muted font-medium">{k('colNext')}</span>
          <p className="font-medium text-aa-ink mt-0.5">
            {formatDate(b.nextChargeAt)}
          </p>
          {hint ? (
            <span className={`block text-xs mt-0.5 font-medium ${hint.tone === 'danger' ? 'text-aa-danger' : hint.tone === 'warning' ? 'text-aa-warning' : 'text-aa-ink-muted'}`}>
              {hint.text}
            </span>
          ) : null}
        </div>
      </div>

      {deferral ? (
        <div className="mt-2 text-xs text-aa-brand bg-aa-brand-soft border border-aa-line px-2 py-1 rounded-aa-sm font-medium">
          {k('deferral.until', { date: formatDate(deferral) })}
        </div>
      ) : null}

      {(regionName(row.regionCode) || districtName(row.districtCode)) ? (
        <div className="pt-2 mt-2 border-t border-aa-line text-xs text-aa-ink-muted flex items-center gap-1.5 truncate">
          <span>{[regionName(row.regionCode), districtName(row.districtCode)].filter(Boolean).join(', ')}</span>
        </div>
      ) : null}
    </div>
  );
}
