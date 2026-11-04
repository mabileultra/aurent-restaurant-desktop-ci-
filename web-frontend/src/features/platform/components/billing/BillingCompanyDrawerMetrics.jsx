import React from 'react';
import { activeDeferralDay, dueHint } from './billingCollectionsUi';

export default function BillingCompanyDrawerMetrics({ p, row, b, k, currency }) {
  const { t, money, formatDate } = p;

  const hasPlan = Boolean(b.planName);
  const hasMonthly = Number(b.monthlyTotal || 0) > 0;
  const planDisplayName = hasPlan
    ? b.planName
    : hasMonthly
    ? k('customPlan')
    : k('noPlanTitle', { defaultValue: 'Tarifsiz' });
  const planSubtext = hasPlan || hasMonthly
    ? hasPlan
      ? 'Cheklovlarsiz funksiyalar'
      : 'Maxsus tarif'
    : 'Tarifsiz rejim';

  const deferralDay = activeDeferralDay(b);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Moliyaviy ko'rsatkichlar &amp; Obuna
        </h4>
        <button
          type="button"
          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline"
          onClick={() => p.setDrawerTab('manage')}
        >
          Tarifni o'zgartirish
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Joriy tarif */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('colPlan')}</span>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate" title={planDisplayName}>
            {planDisplayName}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">{planSubtext}</div>
        </div>

        {/* Metric 2: Oylik to'lov */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('colMonthly')}</span>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
            {money(b.monthlyTotal)} {currency}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">Keyingi oylik reja</div>
        </div>

        {/* Metric 3: Joriy balans */}
        {(() => {
          const isPaymentOverdue = (row?.paymentState || b?.paymentState) === 'OVERDUE';
          const isNegativeBalance = Number(b.balance) < 0;
          return (
            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('currentBalance')}</span>
              <div
                className={`text-base font-bold mt-1 ${
                  isNegativeBalance
                    ? 'text-rose-600'
                    : isPaymentOverdue
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {money(b.balance)} {currency}
              </div>
              <div className="mt-2 text-[10px] font-medium">
                {isNegativeBalance ? (
                  <span className="text-rose-600">Qarzdorlik mavjud</span>
                ) : isPaymentOverdue ? (
                  <span className="text-amber-600 dark:text-amber-400">To‘lov muddati o‘tgan</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">Qarzdorlik yo'q</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Metric 4: Keyingi to'lov */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('colNext')}</span>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {formatDate(b.nextChargeAt) || '—'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            {dueHint(row, t)?.text || (b.nextChargeAt ? '' : 'Muddati belgilanmagan')}
          </div>
        </div>

        {/* Metric 5: Qo'shilgan sana */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('registeredAt')}</span>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
            {formatDate(row.companyCreatedAt) || '—'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">Platforma a'zosi</div>
        </div>

        {/* Metric 6: Oxirgi to'lov */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k('lastPayment')}</span>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {row.lastPaymentMethod ? k(`methods.${row.lastPaymentMethod}`) : '—'}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            {row.lastPaymentAt ? formatDate(row.lastPaymentAt) : "To'lovlar mavjud emas"}
          </div>
        </div>
      </div>

      {deferralDay ? (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
          <div className="font-bold flex items-center space-x-1.5">
            <span>{k('deferral.title')}:</span>
            <span>{k('deferral.until', { date: formatDate(deferralDay) })}</span>
          </div>
          {b.deferralReason ? (
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{b.deferralReason}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
