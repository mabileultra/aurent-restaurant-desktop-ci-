import React, { useState } from 'react';
import { X, AlertTriangle, Check, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import CopyStrategyRadioGroup from './CopyStrategyRadioGroup';

export default function CopyPermissionsModal({
  isOpen,
  onClose,
  sourceUser,
  allUsers = [],
}) {
  const [strategy, setStrategy] = useState('MERGE'); // 'MERGE' | 'REPLACE'
  const [targetUserIds, setTargetUserIds] = useState(() => [2, 7, 3]);

  if (!isOpen || !sourceUser) return null;

  const targetUsers = allUsers.filter((u) => targetUserIds.includes(u.id));
  const validTargets = targetUsers.filter((u) => u.roleCode === sourceUser.roleCode);
  const invalidTargets = targetUsers.filter((u) => u.roleCode !== sourceUser.roleCode);

  const handleRemoveTarget = (id) => {
    setTargetUserIds((prev) => prev.filter((item) => item !== id));
  };

  const handleExecuteCopy = () => {
    toast.success(`${validTargets.length} ta xodimga huquqlar muvaffaqiyatli nusxalandi`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Huquqdan nusxa olish
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bir xodimning istisnolarini shu roldagi boshqa xodimlarga ko‘chiring.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Step 1: KIMDAN */}
          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              1. Kimdan
            </h4>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {sourceUser.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{sourceUser.fullName}</p>
                  <p className="text-[11px] text-slate-500">{sourceUser.username} · {sourceUser.role} · {sourceUser.companyName}</p>
                </div>
              </div>
              <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-300">
                − Oflayn rejim: taqiq
              </span>
            </div>
          </div>

          {/* Step 2: KIMGA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="font-bold uppercase tracking-wider text-slate-400">
                2. Kimga ({targetUsers.length} ta tanlandi)
              </h4>
              <button
                type="button"
                onClick={() => toast('Xodimlar qidiruvi ochildi')}
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline dark:text-emerald-400 font-semibold cursor-pointer"
              >
                <UserPlus size={13} />
                <span>Xodim qo‘shish</span>
              </button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {targetUsers.map((u) => {
                const isMismatch = u.roleCode !== sourceUser.roleCode;
                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between rounded-xl border p-2 transition-colors ${
                      isMismatch
                        ? 'border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                        : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-850'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{u.fullName}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5">{u.username} · {u.role}</span>
                      {isMismatch && (
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={11} />
                          <span>Rol mos emas — bu xodim o‘tkazib yuboriladi</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTarget(u.id)}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: QANDAY KO'CHIRILSIN */}
          <CopyStrategyRadioGroup strategy={strategy} onStrategyChange={setStrategy} />
        </div>

        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {validTargets.length} xodimga qo‘llanadi {invalidTargets.length > 0 ? `· ${invalidTargets.length} tasi o‘tkazib yuboriladi` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleExecuteCopy}
              disabled={validTargets.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 dark:bg-emerald-500"
            >
              <Check size={14} />
              <span>{validTargets.length} xodimga nusxalash</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
