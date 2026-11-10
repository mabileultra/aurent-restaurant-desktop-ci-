import React from 'react';
import { Clock, Globe, Info, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCheckbox, BaseButton, BaseInput } from '../../../../components/ui';

export default function PlatformSecuritySessionIpRulesCard({ rules, flow }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-700" />
          <span>{t('platform.security.sessionsRuleTitle', 'Faolsizlik va seanslar')}</span>
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">
              {t('platform.security.concSessions', 'Bir vaqtda ruxsat etilgan seanslar')}
            </span>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {[1, 2, 3, 5].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => flow.setConc(c)}
                  className={`flex-1 py-1 font-bold rounded-md ${
                    rules.conc === c
                      ? 'bg-white dark:bg-slate-900 text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {c} {t('platform.security.qtySuffix', 'ta')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span>{t('platform.security.newDeviceAlert', 'Yangi qurilmadan kirganda email ogohlantirish')}</span>
            <BaseCheckbox checked={Boolean(rules.notify)} onChange={flow.toggleNotify} size={18} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>{t('platform.security.ipAllowlistTitle', 'IP oq ro‘yxati')}</span>
          </h3>
          <BaseCheckbox checked={Boolean(rules.ipOn)} onChange={flow.toggleIpOn} size={18} />
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          <Info className="w-4 h-4 shrink-0 text-slate-400" />
          <span>
            {rules.ipOn
              ? t('platform.security.ipOnHint', 'Faqat ro‘yxatdagi IP’dan login ruxsat etiladi.')
              : t('platform.security.ipOffHint', 'IP filtri o‘chirilgan — barcha manzillar ruxsat.')}
          </span>
        </div>
        <div className="flex gap-2">
          <BaseInput
            value={flow.newIpAddr}
            onChange={(e) => flow.setNewIpAddr(e.target.value)}
            placeholder="213.230.98.0/24"
            className="flex-1 text-xs"
          />
          <BaseButton type="button" variant="secondary" onClick={flow.addIp} disabled={!flow.newIpAddr?.trim()}>
            <Plus className="w-4 h-4" />
          </BaseButton>
        </div>
        <div className="space-y-1.5">
          {(rules.ips || []).map((ip, idx) => (
            <div
              key={`${ip.addr}-${idx}`}
              className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
            >
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {ip.addr}
                {ip.note ? <span className="text-slate-400"> ({ip.note})</span> : null}
              </span>
              <button
                type="button"
                className="text-rose-600 hover:text-rose-700 p-1"
                onClick={() => flow.removeIp(idx)}
                aria-label="remove-ip"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
