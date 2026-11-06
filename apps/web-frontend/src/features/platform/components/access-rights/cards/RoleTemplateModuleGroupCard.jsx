import React from 'react';

/**
 * Shablon sozlash yon panelidagi har bir modul guruhi kartochkasi
 * role="switch" va aria-checked semantik tugmalari bilan (A.4 talabi)
 */
export default function RoleTemplateModuleGroupCard({
  group,
  activeModules,
  dirtyModules = new Map(),
  onToggleModule,
  onEnableAllInGroup,
  onDisableAllInGroup,
  isReadOnly = false,
}) {
  const groupTotal = group.modules.length;
  const groupActive = group.modules.filter((m) =>
    dirtyModules.has(m.id) ? dirtyModules.get(m.id) : activeModules.has(m.id)
  ).length;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-850/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {group.title}
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
            {groupActive} / {groupTotal}
          </span>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => onEnableAllInGroup(group.modules)}
              className="text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
            >
              Hammasini yoqish
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => onDisableAllInGroup(group.modules)}
              className="text-slate-500 hover:underline dark:text-slate-400 cursor-pointer"
            >
              Hammasini o‘chirish
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
        {group.modules.map((m) => {
          const isDirty = dirtyModules.has(m.id);
          const isEnabled = isDirty ? dirtyModules.get(m.id) : activeModules.has(m.id);

          return (
            <button
              key={m.id}
              type="button"
              role="switch"
              aria-checked={isEnabled}
              aria-label={m.name}
              disabled={isReadOnly}
              onClick={() => !isReadOnly && onToggleModule && onToggleModule(m.id)}
              className={`w-full text-left flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isReadOnly ? 'cursor-default' : 'cursor-pointer'
              } ${
                isEnabled
                  ? isReadOnly
                    ? 'border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850/60 opacity-80'
                    : 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : 'border-slate-200/70 bg-white hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-850 opacity-50'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-1">
                <span className={`text-xs font-medium truncate ${
                  isReadOnly ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {m.name}
                </span>
                {isDirty && (
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    Saqlanmagan · {isEnabled ? 'yoqiladi' : 'o‘chiriladi'}
                  </span>
                )}
              </div>
              <div
                className={`h-5 w-9 shrink-0 rounded-full transition-colors p-0.5 ${
                  isEnabled
                    ? isReadOnly
                      ? 'bg-slate-400 dark:bg-slate-600'
                      : 'bg-emerald-700'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
