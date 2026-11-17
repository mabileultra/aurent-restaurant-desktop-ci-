import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BaseCheckbox } from '../../../../components/ui';
import { activeDeferralDay, balanceTone, dueHint, initials } from './billingCollectionsUi';

function getPaymentStatusBadge(state, label) {
  let cls = 'bg-aa-surface-sunken text-aa-ink-muted border-aa-line';
  if (state === 'ACTIVE') {
    cls = 'bg-aa-success-soft text-aa-success border-aa-line';
  } else if (state === 'NOT_BILLED') {
    cls = 'bg-[#eaf1fe] text-[#1d4ed8] border-transparent dark:bg-[#1d4ed8]/20 dark:text-[#93c5fd]';
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

export default function BillingCompanyTableRow({
  row,
  p,
  c,
  regionName,
  districtName,
  k,
  formatDate,
  money,
  currency,
  t,
}) {
  const b = row.billing;
  const hint = dueHint(row, t);
  const selected = p.selectedCompanyId === b.companyId;

  return (
    <tr
      key={b.companyId}
      className={`transition-colors cursor-pointer ${
        selected ? 'bg-aa-surface-selected hover:bg-aa-surface-selected' : 'hover:bg-aa-surface-hover'
      }`}
      onClick={() => p.selectCompany(row)}
    >
      <td
        className="bc-table__check w-12 px-3 py-3 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <BaseCheckbox
          variant="aa"
          checked={c.selectedIds.has(b.companyId)}
          onChange={() => c.toggleSelect(b.companyId)}
          ariaLabel={b.companyName}
          size={18}
        />
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center gap-2.5 min-w-[13rem]">
          <span className="w-8 h-8 rounded-aa-sm bg-aa-surface-sunken text-aa-ink-muted border border-aa-line font-semibold text-xs flex items-center justify-center shrink-0">
            {initials(b.companyName)}
          </span>
          <div className="flex flex-col">
            <span className="font-semibold text-aa-ink">{b.companyName || `#${b.companyId}`}</span>
            <span className="text-xs text-aa-ink-muted flex items-center gap-1.5 mt-0.5">
              ID: <span className="font-mono">{b.companyId}</span>
              {row.newCompany ? (
                <span className="px-1.5 py-0.2 rounded-aa-sm text-xs font-semibold bg-aa-brand-soft text-aa-brand border border-aa-line">
                  {k('newBadge')}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-aa-ink-muted align-middle">{regionName(row.regionCode)}</td>
      <td className="px-3 py-3 text-xs text-aa-ink-muted align-middle">{districtName(row.districtCode)}</td>
      <td className="px-3 py-3 align-middle">
        {b.planName ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-aa-sm text-xs font-semibold bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
            {b.planName}
          </span>
        ) : (
          <span className="text-xs text-aa-ink-muted">{Number(b.monthlyTotal) > 0 ? k('customPlan') : '—'}</span>
        )}
      </td>
      <td className="bc-num px-3 py-3 align-middle font-medium aa-num text-aa-ink whitespace-nowrap">
        {money(b.monthlyTotal)} {currency}
      </td>
      <td
        className={`bc-num px-3 py-3 align-middle font-medium aa-num whitespace-nowrap ${
          balanceTone(b.balance) === 'danger'
            ? 'text-aa-danger'
            : balanceTone(b.balance) === 'warning'
              ? 'text-aa-warning'
              : 'text-aa-ink'
        }`}
      >
        {money(b.balance)} {currency}
      </td>
      <td className="px-3 py-3 align-middle whitespace-nowrap">
        <span className="font-medium text-xs text-aa-ink">{formatDate(b.nextChargeAt)}</span>
        {hint ? (
          <span
            className={`block text-xs mt-0.5 font-medium ${
              hint.tone === 'danger'
                ? 'text-aa-danger'
                : hint.tone === 'warning'
                  ? 'text-aa-warning'
                  : 'text-aa-ink-muted'
            }`}
          >
            {hint.text}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 align-middle whitespace-nowrap">
        {getPaymentStatusBadge(row.paymentState, k(`states.${row.paymentState}`))}
        {activeDeferralDay(b) ? (
          <span className="block text-xs text-aa-brand mt-0.5 font-medium">
            {k('deferral.until', { date: formatDate(activeDeferralDay(b)) })}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 align-middle whitespace-nowrap">
        {row.lastPaymentMethod ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-aa-sm text-xs font-medium bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
            {k(`methods.${row.lastPaymentMethod}`)}
          </span>
        ) : (
          <span className="text-xs text-aa-ink-muted">—</span>
        )}
      </td>
      <td className="w-12 px-3 py-3 text-center align-middle">
        <button
          type="button"
          className="w-8 h-8 inline-flex items-center justify-center rounded-aa-sm text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-hover transition-colors cursor-pointer"
          aria-label={t('common.details', { defaultValue: 'Batafsil' })}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </td>
    </tr>
  );
}
