import React from 'react';
import { Shield, Smartphone, Mail, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlatformSecurityTwoFactorRulesCard({ rules }) {
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
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
          {t('platform.security.comingSoon', 'Tez kunda')}
        </span>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 shrink-0 text-slate-400" />
        <span>{t('platform.security.tfaNotice', '2FA sozlamalari backend servis tayyor bo‘lgach ishga tushadi (hozircha ko‘rish rejimida).')}</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg">
        {[
          { id: 'sa', label: t('platform.security.roles.superAdmin', 'Super-admin'), on: false, hint: t('platform.security.tfaHintSuperAdmin', 'Super-admin hisoblariga kirishda') },
          { id: 'op', label: t('platform.security.roles.operator', 'Platforma operatori'), on: false, hint: t('platform.security.tfaHintOperator', 'Operator hisoblariga kirishda') },
          { id: 'an', label: t('platform.security.roles.analytics', 'Platforma analitigi'), on: false, hint: t('platform.security.tfaHintAnalytics', 'Analitika hisoblariga kirishda') },
        ].map((r) => (
          <div key={r.id} className="p-3 flex items-center justify-between gap-3 opacity-60">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{r.label}</span>
              <p className="text-[11px] text-slate-400">{r.hint}</p>
            </div>
            <button
              type="button"
              disabled
              className="w-10 h-6 rounded-full transition-colors relative p-0.5 bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
              title={t('platform.security.comingSoon', 'Tez kunda')}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform translate-x-0" />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
          {t('platform.security.tfaMethod', '2FA Usuli')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
          {[
            { id: 'app', title: t('platform.security.tfaAppTitle', 'Authenticator ilova'), desc: t('platform.security.tfaAppDesc', 'Google Authenticator yoki Authy'), icon: Smartphone },
            { id: 'email', title: t('platform.security.tfaEmailTitle', 'Email orqali kod'), desc: t('platform.security.tfaEmailDesc', 'Kirishda xodim emailiga 6 xonali kod yuboriladi'), icon: Mail },
          ].map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-not-allowed ${
                rules.method === m.id
                  ? 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <m.icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.title}</div>
                <p className="text-[11px] text-slate-500">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
