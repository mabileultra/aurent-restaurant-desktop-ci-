import React from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { BaseButton, BaseInput } from '../../../../components/ui';

export default function PlatformSecurityCashierPasswordCard({
  flow,
}) {
  const {
    cashierPw1,
    setCashierPw1,
    cashierPw2,
    setCashierPw2,
    showCashierPw,
    setShowCashierPw,
    cashierPwStrength,
    isCashierPwMismatch,
    canSaveCashierPw,
    handleCashierPwSave,
    isCashierSaving,
    cashierStatus,
  } = flow;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Kassa server sozlamalari paroli
            </h3>
            <p className="text-xs text-slate-500">
              Kassirlar desktop ilovada server sozlamalarini o‘zgartirishi uchun himoya paroli
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300">
        Standart parol: <span className="font-mono font-bold">1234</span>. Xavfsizlik uchun uni yangi murakkab parolga almashtiring.
      </div>

      <form onSubmit={handleCashierPwSave} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <BaseInput
              label="Yangi parol"
              type={showCashierPw ? 'text' : 'password'}
              value={cashierPw1}
              onChange={(e) => setCashierPw1(e.target.value)}
              placeholder="Yangi parol kiritish"
              required
            />
            <button
              type="button"
              onClick={() => setShowCashierPw(!showCashierPw)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
              {showCashierPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <BaseInput
              label="Parolni takrorlang"
              type={showCashierPw ? 'text' : 'password'}
              value={cashierPw2}
              onChange={(e) => setCashierPw2(e.target.value)}
              placeholder="Parolni qayta kiriting"
              required
            />
          </div>
        </div>

        {/* Kuchlilik indikatori */}
        {cashierPw1 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: cashierPwStrength.textColor }}>
                Kuchlilik: {cashierPwStrength.label}
              </span>
              {isCashierPwMismatch ? (
                <span className="text-rose-600 font-semibold">Parollar mos emas</span>
              ) : cashierPw2 && cashierPw1 === cashierPw2 ? (
                <span className="text-emerald-600 font-semibold">Parollar mos</span>
              ) : null}
            </div>
            <div className="flex gap-1.5 h-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex-1 rounded-full transition-colors ${
                    step <= cashierPwStrength.score ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{
                    backgroundColor:
                      step <= cashierPwStrength.score ? cashierPwStrength.color : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            {cashierStatus?.updatedAt
              ? `Oxirgi o‘zgarish: ${cashierStatus.updatedAt}`
              : ''}
          </span>
          <BaseButton
            type="submit"
            disabled={!canSaveCashierPw || isCashierSaving}
            className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            {isCashierSaving ? 'Saqlanmoqda...' : 'Parolni saqlash'}
          </BaseButton>
        </div>
      </form>
    </div>
  );
}
