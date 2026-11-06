import React from 'react';
import { Shield, Smartphone, Mail } from 'lucide-react';

export default function PlatformSecurityTwoFactorRulesCard({
  rules,
  toggleTfaRole,
  setTfaMethod,
}) {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-700" />
          <span>Ikki bosqichli tasdiqlash (2FA)</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Xodimlar tizimga kirishda paroldan tashqari 6 xonali tasdiqlash kodini kiritadi
        </p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg">
        {[
          { id: 'sa', label: 'Super-admin', on: rules.tfa.sa, hint: 'Majburiy · hammasida ulangan' },
          { id: 'op', label: 'Platforma operatori', on: rules.tfa.op, hint: rules.tfa.op ? 'Majburiy' : 'Ixtiyoriy · ulanmagan' },
          { id: 'an', label: 'Platforma analitigi', on: rules.tfa.an, hint: rules.tfa.an ? 'Majburiy' : 'Ixtiyoriy · ulanmagan' },
        ].map((r) => (
          <div key={r.id} className="p-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{r.label}</span>
              <p className="text-[11px] text-slate-400">{r.hint}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleTfaRole(r.id)}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                r.on ? 'bg-emerald-700' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  r.on ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">2FA Usuli</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'app', title: 'Authenticator ilova', desc: 'Google Authenticator yoki Authy · Tavsiya etiladi', icon: Smartphone },
            { id: 'email', title: 'Email orqali kod', desc: 'Kirishda xodim emailiga 6 xonali kod yuboriladi', icon: Mail },
          ].map((m) => (
            <div
              key={m.id}
              onClick={() => setTfaMethod(m.id)}
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                rules.method === m.id
                  ? 'border-emerald-700 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <m.icon className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
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
