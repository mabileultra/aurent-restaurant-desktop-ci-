import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

/**
 * Global qidiruv natijalari bo'limi (SRP):
 * Har bir xodimning o'z faoliyat turi, roli va kompaniyasi aniq ko'rsatiladi.
 */
export default function SearchResultsSection({
  searchTerm,
  users = [],
  currentLang = 'uz',
  onEditUser,
  onResetUser,
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          «{searchTerm}» {currentLang === 'ru' ? 'не найдено сотрудников' : 'bo‘yicha hech qanday xodim topilmadi'}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {currentLang === 'ru' ? 'Попробуйте изменить поисковый запрос' : 'Qidiruv so‘zini o‘zgartiring yoki filtrlarni tozalang'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200 font-semibold flex items-center justify-between">
        <span>«{searchTerm}» bo‘yicha {users.length} ta xodim topildi</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map((u) => {
          const uId = u.userId || u.id;
          const initials = (u.fullName || u.username || 'U').substring(0, 2).toUpperCase();
          const hasExceptions = Boolean(u.moduleAccessCustom || u.customAccess);

          return (
            <div
              key={uId}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {u.fullName || u.username}
                    </span>
                    {hasExceptions ? (
                      <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-300">
                        Istisno bor
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Shablon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{u.role}</span>
                    <span>·</span>
                    <span className="truncate">{u.companyName || u.businessTypeName}</span>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.2 text-[10px] font-semibold dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                      {u.businessTypeName || u.businessType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => onEditUser?.(u)}
                  aria-label={`${u.fullName || u.username} huquqlarini sozlash`}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900 cursor-pointer"
                >
                  <SlidersHorizontal size={13} />
                  <span>Sozlash</span>
                </button>
                {hasExceptions && (
                  <button
                    type="button"
                    onClick={() => onResetUser?.(u)}
                    aria-label={`${u.fullName || u.username}ni shablonga qaytarish`}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Shablonga</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
