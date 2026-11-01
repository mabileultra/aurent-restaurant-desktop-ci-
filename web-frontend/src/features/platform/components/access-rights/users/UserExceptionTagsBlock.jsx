import React from 'react';
import { Plus, Minus, X } from 'lucide-react';

export default function UserExceptionTagsBlock({
  type, // 'GRANT' | 'DENY'
  title,
  subtitle,
  items = [],
  availableSuggestions = [],
  onAdd,
  onRemove,
}) {
  const isGrant = type === 'GRANT';

  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2.5 ${
        isGrant
          ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
          : 'border-rose-200/80 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold ${
            isGrant ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'
          }`}
        >
          {title}
        </span>
        <span
          className={`text-[11px] ${
            isGrant ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {subtitle}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
        {items.length === 0 ? (
          <span className="text-xs text-slate-400 italic">Hozircha {isGrant ? 'qo‘shimcha ruxsat' : 'taqiq'} yo‘q</span>
        ) : (
          items.map((id) => (
            <span
              key={id}
              className={`inline-flex items-center gap-1 rounded-lg text-white px-2.5 py-1 text-xs font-semibold shadow-2xs ${
                isGrant ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-rose-600 dark:bg-rose-500'
              }`}
            >
              <span>{isGrant ? `+ ${id}` : `− ${id}`}</span>
              <button
                type="button"
                onClick={() => onRemove(id)}
                className={`rounded-full p-0.5 cursor-pointer ${
                  isGrant ? 'hover:bg-emerald-700' : 'hover:bg-rose-700'
                }`}
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      {availableSuggestions.length > 0 && (
        <div
          className={`pt-2 border-t ${
            isGrant ? 'border-emerald-200/60 dark:border-emerald-900/40' : 'border-rose-200/60 dark:border-rose-900/40'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-2">
            {isGrant ? 'Ruxsat berish:' : 'Taqiqlash:'}
          </span>
          <div className="inline-flex flex-wrap gap-1 mt-1">
            {availableSuggestions.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onAdd(m.name)}
                className={`inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-0.5 text-xs font-medium cursor-pointer ${
                  isGrant
                    ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300'
                    : 'border-rose-300 text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300'
                }`}
              >
                {isGrant ? <Plus size={11} /> : <Minus size={11} />}
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
