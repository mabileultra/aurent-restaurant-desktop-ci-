import React from 'react';
import { X, Check } from 'lucide-react';

export default function RoleTemplatesMatrixModal({
  isOpen,
  onClose,
  businessTypeName,
  roles = [],
  moduleGroups = [],
  matrixState = {},
  onToggleCell,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col w-full max-w-5xl max-h-[90vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {businessTypeName} — rollar va modullar matritsasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Qaysi rol qaysi modulga kira olishini bir jadvalda ko‘ring va tahrirlang.
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

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 font-semibold text-slate-500 uppercase tracking-wider w-1/3">
                  Modul
                </th>
                {roles.map((r) => (
                  <th key={r.code} className="py-2.5 px-3 font-semibold text-center text-slate-700 dark:text-slate-200">
                    <div className="font-bold">{r.name}</div>
                    <div className="text-[10px] font-normal text-slate-400">{r.totalEmployees} xodim</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {moduleGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <tr className="bg-slate-50/70 dark:bg-slate-850/60">
                    <td colSpan={roles.length + 1} className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {group.title}
                    </td>
                  </tr>
                  {group.modules.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 pl-6 text-slate-700 dark:text-slate-300">
                        {m.name}
                      </td>
                      {roles.map((r) => {
                        const isChecked = Boolean(matrixState[`${r.code}:${m.id}`]);
                        return (
                          <td key={r.code} className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleCell?.(r.code, m.id)}
                              className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-colors cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                              }`}
                            >
                              {isChecked ? <Check size={13} strokeWidth={3} /> : null}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-end border-t border-slate-100 px-6 py-3.5 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 cursor-pointer"
          >
            Yopish
          </button>
        </footer>
      </div>
    </div>
  );
}
