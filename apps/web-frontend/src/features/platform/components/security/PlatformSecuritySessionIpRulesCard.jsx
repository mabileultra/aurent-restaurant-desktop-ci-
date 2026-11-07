import React from 'react';
import { Clock, Globe, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCheckbox } from '../../../../components/ui';

export default function PlatformSecuritySessionIpRulesCard({ rules }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>{t('platform.security.sessionsRuleTitle', 'Faolsizlik va seanslar')}</span>
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
            {t('platform.security.comingSoon', 'Tez kunda')}
          </span>
        </div>
        <div className="space-y-3 text-xs opacity-60">
          <div>
            <span className="text-slate-500 block mb-1">
              {t('platform.security.concSessions', 'Bir vaqtda ruxsat etilgan seanslar')}
            </span>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {[1, 2, 3, 5].map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled
                  className={`flex-1 py-1 font-bold rounded-md cursor-not-allowed ${
                    rules.conc === c
                      ? 'bg-white dark:bg-slate-900 text-slate-700 shadow-xs'
                      : 'text-slate-400'
                  }`}
                >
                  {c} {t('platform.security.qtySuffix', 'ta')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed">
            <span>{t('platform.security.newDeviceAlert', 'Yangi qurilmadan kirganda email ogohlantirish')}</span>
            <BaseCheckbox
              checked={rules.notify}
              onChange={() => {}}
              disabled
              size={18}
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>{t('platform.security.ipAllowlistTitle', 'IP oq ro‘yxati')}</span>
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
            {t('platform.security.comingSoon', 'Tez kunda')}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          <Info className="w-4 h-4 shrink-0 text-slate-400" />
          <span>{t('platform.security.ipNotice', 'IP filtrlash sozlamalari backend tayyor bo‘lgach ulanadi.')}</span>
        </div>
        <div className="space-y-1.5 opacity-60">
          {rules.ips.map((ip, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
            >
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {ip.addr} <span className="text-slate-400">({ip.note})</span>
              </span>
              <span className="text-[10px] text-slate-400">Ko‘rish</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
