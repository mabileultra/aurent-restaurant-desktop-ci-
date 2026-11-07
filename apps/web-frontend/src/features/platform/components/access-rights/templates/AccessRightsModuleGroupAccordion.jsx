import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AccessRightsModuleGroupAccordion({
  group,
  moduleToggles = {},
  onToggleModule,
  onEnableAll,
  onDisableAll,
}) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const [isOpen, setIsOpen] = useState(true);

  const modules = group.modules || [];
  const enabledCount = modules.filter((m) => Boolean(moduleToggles[m.id])).length;
  const totalCount = modules.length;

  const handleEnable = () => {
    if (onEnableAll) {
      onEnableAll(modules.map((m) => m.id));
    }
  };

  const handleDisable = () => {
    if (onDisableAll) {
      onDisableAll(modules.map((m) => m.id));
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-left"
        >
          {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span>{group.title}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {enabledCount} / {totalCount}
          </span>
        </button>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleEnable}
            className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            {isRu ? 'Включить все' : 'Hammasini yoqish'}
          </button>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <button
            type="button"
            onClick={handleDisable}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold cursor-pointer"
          >
            {isRu ? 'Отключить все' : 'Hammasini o‘chirish'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {modules.map((m) => {
            const isEnabled = Boolean(moduleToggles[m.id]);
            return (
              <label
                key={m.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  isEnabled
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100'
                    : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="truncate pr-2">{m.name}</span>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => onToggleModule(m.id, e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
