import React from 'react';
import { Lock, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCheckbox } from '../../../../components/ui';

export default function PlatformSecurityPasswordRulesCard({ rules }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>{t('platform.security.pwdRulesTitle', 'Parol talablari')}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('platform.security.pwdRulesSubtitle', 'Xodimlar paroli qanchalik murakkab bo‘lishi lozimligi')}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
          {t('platform.security.comingSoon', 'Tez kunda')}
        </span>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 shrink-0 text-slate-400" />
        <span>{t('platform.security.pwdRulesNotice', 'Parol siyosati backend integratsiyasi yakunlangach to‘liq ishga tushadi (hozircha ko‘rish rejimida).')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            {t('platform.security.minLenLabel', 'Eng kam uzunlik')}
          </label>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[8, 10, 12, 14].map((v) => (
              <button
                key={v}
                type="button"
                disabled
                className={`flex-1 py-1 text-xs font-bold rounded-md cursor-not-allowed ${
                  rules.minLen === v ? 'bg-white dark:bg-slate-900 text-slate-700 shadow-xs' : 'text-slate-400'
                }`}
              >
                {v} {t('platform.security.charsSuffix', 'belgi')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            {t('platform.security.expiryLabel', 'Parolni almashtirish')}
          </label>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[
              { v: 0, l: t('platform.security.expiryNone', 'Majburiy emas') },
              { v: 90, l: t('platform.security.expiry90', '90 kunda') },
              { v: 180, l: t('platform.security.expiry180', '180 kunda') },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                disabled
                className={`flex-1 py-1 text-xs font-bold rounded-md cursor-not-allowed ${
                  rules.expiry === opt.v ? 'bg-white dark:bg-slate-900 text-slate-700 shadow-xs' : 'text-slate-400'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 opacity-60">
        {[
          { k: 'case', l: t('platform.security.reqCase', 'Katta va kichik harf qatnashishi shart') },
          { k: 'digit', l: t('platform.security.reqDigit', 'Kamida bitta raqam bo‘lishi shart') },
          { k: 'special', l: t('platform.security.reqSpecial', 'Maxsus belgi (!, @, #, $) shart') },
          { k: 'history', l: t('platform.security.reqHistory', 'Oxirgi 5 parolni takrorlamaslik') },
        ].map((c) => (
          <div key={c.k} className="flex items-center gap-2.5 p-2 rounded-lg cursor-not-allowed">
            <BaseCheckbox
              checked={Boolean(rules.req[c.k])}
              onChange={() => {}}
              disabled
              size={18}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{c.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
