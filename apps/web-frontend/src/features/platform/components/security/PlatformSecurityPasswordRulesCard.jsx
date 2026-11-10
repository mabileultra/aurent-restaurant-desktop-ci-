import React from 'react';
import { Lock, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCheckbox } from '../../../../components/ui';

const REQ_KEYS = [
  { k: 'case', key: 'platform.security.reqCase', label: 'Katta va kichik harf qatnashishi shart' },
  { k: 'digit', key: 'platform.security.reqDigit', label: 'Kamida bitta raqam bo‘lishi shart' },
  { k: 'special', key: 'platform.security.reqSpecial', label: 'Maxsus belgi (!, @, #, $) shart' },
  { k: 'history', key: 'platform.security.reqHistory', label: 'Oxirgi 5 parolni takrorlamaslik' },
];

export default function PlatformSecurityPasswordRulesCard({ rules, flow }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-700" />
          <span>{t('platform.security.pwdRulesTitle', 'Parol talablari')}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('platform.security.pwdRulesSubtitle', 'Xodimlar paroli qanchalik murakkab bo‘lishi lozimligi')}
        </p>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 shrink-0 text-slate-400" />
        <span>
          {t(
            'platform.security.pwdRulesLiveNotice',
            'Qoidalar saqlanadi; yangi/o‘zgartirilgan parollarda qo‘llanadi. Muddati login’da hali majburiy emas.'
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            {t('platform.security.minLenLabel', 'Eng kam uzunlik')}
          </label>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[8, 10, 12, 14].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => flow.setMinLen(v)}
                className={`flex-1 py-1 text-xs font-bold rounded-md ${
                  rules.minLen === v
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
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
                onClick={() => flow.setExpiry(opt.v)}
                className={`flex-1 py-1 text-xs font-bold rounded-md ${
                  rules.expiry === opt.v
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {REQ_KEYS.map((c) => (
          <div key={c.k} className="flex items-center gap-2.5 p-2 rounded-lg">
            <BaseCheckbox
              checked={Boolean(rules.req?.[c.k])}
              onChange={() => flow.toggleReq(c.k)}
              size={18}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {t(c.key, c.label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
