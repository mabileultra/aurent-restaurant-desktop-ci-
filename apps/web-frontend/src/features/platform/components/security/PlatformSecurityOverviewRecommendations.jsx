import React from 'react';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';

const SEVERITY_STYLES = {
  high: { label: 'Muhim', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
  mid: { label: 'O‘rta', badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  low: { label: 'Past', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
};

export default function PlatformSecurityOverviewRecommendations({
  recommendations,
  completedChecks,
  doneOpen,
  toggleDone,
  handleAction,
}) {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
          Tavsiyalar
        </h2>
        <button
          type="button"
          onClick={toggleDone}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1"
        >
          <span>{doneOpen ? 'Bajarilganlarni yashirish' : 'Bajarilgan 4 ta'}</span>
          {doneOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {doneOpen && (
        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 space-y-2">
          {completedChecks.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const s = SEVERITY_STYLES[rec.severity] || SEVERITY_STYLES.low;
          return (
            <div
              key={rec.id}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${s.badge}`}>
                    {s.label}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {rec.title}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{rec.desc}</p>
              </div>
              <BaseButton
                variant="secondary"
                className="text-xs font-semibold shrink-0 self-start sm:self-center"
                onClick={() => handleAction(rec.targetTab)}
              >
                {rec.action}
              </BaseButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
