import React, { useState } from 'react';
import { RefreshCw, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function PlatformLeadAdminSection({
  leadName,
  branchName,
  onBranchNameChange,
  createAdmin,
  onCreateAdminChange,
  adminName,
  onAdminNameChange,
  adminLogin,
  onAdminLoginChange,
  adminEmail,
  onAdminEmailChange,
  adminPassword,
  onAdminPasswordChange,
  onRegeneratePassword,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
        Birinchi filial va admin
      </h4>
      <div>
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
          Filial nomi
        </label>
        <input
          type="text"
          value={branchName}
          onChange={(e) => onBranchNameChange(e.target.value)}
          className="w-full sm:max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={createAdmin}
            onChange={(e) => onCreateAdminChange(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>Ariza egasini admin qilib yaratish</span>
        </label>
        <p className="text-[11px] text-slate-500 pl-5">
          {leadName} kompaniyaning birinchi administratori bo'ladi.
        </p>
        {createAdmin && (
          <div className="space-y-2 pt-1 pl-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Ism</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => onAdminNameChange(e.target.value)}
                  placeholder="Ism"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Login *</label>
                <input
                  type="text"
                  required={createAdmin}
                  value={adminLogin}
                  onChange={(e) => onAdminLoginChange(e.target.value)}
                  placeholder="Login"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Email *</label>
                <input
                  type="email"
                  required={createAdmin}
                  value={adminEmail}
                  onChange={(e) => onAdminEmailChange(e.target.value)}
                  placeholder="masalan: user@domain.uz"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-medium text-slate-500">Parol (avtomatik yaratildi)</label>
                  <button
                    type="button"
                    onClick={onRegeneratePassword}
                    title="Yangi parol yaratish"
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    <span>Qayta yaratish</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => onAdminPasswordChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pr-8 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>Arizani yakunlash</span>
        </div>
        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/85 pl-6 pt-0.5">
          Kompaniya yaratilgach, ariza holati avtomatik «Yakunlangan»ga o'tkaziladi va yaratilgan kompaniya ma'lumotlari tarixga qayd etiladi.
        </p>
      </div>
    </div>
  );
}
