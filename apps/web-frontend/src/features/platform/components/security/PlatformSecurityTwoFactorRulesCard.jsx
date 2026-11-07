import React from 'react';
import { Shield, Smartphone, Mail, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseButton } from '../../../../components/ui';

const TFA_ROLES = [
  { id: 'sa', labelKey: 'platform.security.roles.superAdmin', label: 'Super-admin', hintKey: 'platform.security.tfaHintSuperAdmin', hint: 'Super-admin hisoblariga kirishda' },
  { id: 'op', labelKey: 'platform.security.roles.operator', label: 'Platforma operatori', hintKey: 'platform.security.tfaHintOperator', hint: 'Operator hisoblariga kirishda' },
  { id: 'an', labelKey: 'platform.security.roles.analytics', label: 'Platforma analitigi', hintKey: 'platform.security.tfaHintAnalytics', hint: 'Analitika hisoblariga kirishda' },
];

export default function PlatformSecurityTwoFactorRulesCard({ rules, flow, onOpenPersonal2fa }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            <span>{t('platform.security.tfaTitle', 'Ikki bosqichli tasdiqlash (2FA)')}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('platform.security.tfaSubtitle', 'Xodimlar tizimga kirishda paroldan tashqari 6 xonali tasdiqlash kodini kiritadi')}
          </p>
        </div>
        <BaseButton type="button" variant="secondary" className="text-xs shrink-0" onClick={onOpenPersonal2fa}>
          {t('platform.security.setupMy2fa', 'Mening 2FA')}
        </BaseButton>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 shrink-0 text-slate-400" />
        <span>{t('platform.security.tfaLiveNotice', 'Rol bo‘yicha majburiy 2FA login’da tekshiriladi. Avval o‘zingizda 2FA yoqing.')}</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg">
        {TFA_ROLES.map((r) => {
          const on = Boolean(rules.tfa?.[r.id]);
          return (
            <div key={r.id} className="p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t(r.labelKey, r.label)}
                </span>
                <p className="text-[11px] text-slate-400">{t(r.hintKey, r.hint)}</p>
              </div>
              <button
                type="button"
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  on ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                onClick={() => flow.toggleTfaRole(r.id)}
                aria-pressed={on}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    on ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
          {t('platform.security.tfaMethod', '2FA Usuli')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => flow.setTfaMethod('app')}
            className={`p-3 rounded-xl border flex items-start gap-3 text-left ${
              rules.method === 'app'
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {t('platform.security.tfaAppTitle', 'Authenticator ilova')}
              </div>
              <p className="text-[11px] text-slate-500">
                {t('platform.security.tfaAppDesc', 'Google Authenticator yoki Authy')}
              </p>
            </div>
          </button>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3 opacity-50 cursor-not-allowed">
            <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {t('platform.security.tfaEmailTitle', 'Email orqali kod')}
              </div>
              <p className="text-[11px] text-slate-500">
                {t('platform.security.comingSoon', 'Tez kunda')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
