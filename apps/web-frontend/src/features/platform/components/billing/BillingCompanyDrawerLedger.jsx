import React from 'react';
import {
  CheckCircle2,
  MinusCircle,
  PlusCircle,
} from 'lucide-react';
import { localizeLedgerDescription } from '../../utils/localizeLedgerDescription';

const LEDGER_ICON = {
  TOP_UP: PlusCircle,
  BONUS: PlusCircle,
  CHARGE: MinusCircle,
  MODULE: MinusCircle,
};

export function LedgerTimeline({ p, limit }) {
  const { t, money, formatDate } = p;
  const rows = limit ? p.ledger.slice(0, limit) : p.ledger;
  if (p.ledgerLoading) {
    return <p className="text-xs text-slate-400 py-3 text-center">{t('common.loading')}</p>;
  }
  if (!rows.length) {
    return (
      <p className="text-xs text-slate-400 py-3 text-center">
        {t('platform.billing.collections.historyEmpty')}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((e) => {
        const positive = Number(e.amount) >= 0;
        const Icon = LEDGER_ICON[e.entryType] || CheckCircle2;
        return (
          <li
            key={e.id}
            className={`flex items-start justify-between gap-3 p-2.5 rounded-xl border text-xs bg-white dark:!bg-slate-800/80 ${
              positive
                ? 'border-emerald-200/80 dark:border-emerald-900/60 border-l-4 border-l-emerald-600'
                : 'border-rose-200/80 dark:border-rose-900/60 border-l-4 border-l-rose-600'
            }`}
          >
            <div className="flex items-start space-x-2.5 min-w-0">
              <div
                className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                  positive
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                    : 'text-rose-600 bg-rose-50 dark:bg-rose-950'
                }`}
              >
                <Icon size={15} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {t(`billing.ledgerTypes.${e.entryType}`, { defaultValue: e.entryType })}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {e.paymentMethod ? `${t(`platform.billing.collections.methods.${e.paymentMethod}`)} · ` : ''}
                  {localizeLedgerDescription(e.description, t) || '—'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p
                className={`font-bold tabular-nums ${
                  positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {positive ? '+' : ''}{money(e.amount)} {t('billing.currency')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(e.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
