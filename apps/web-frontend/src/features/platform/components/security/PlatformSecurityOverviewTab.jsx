import React from 'react';
import {
  AlertTriangle,
  Radio,
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  LogIn,
  BarChart2,
  Inbox,
} from 'lucide-react';
import PlatformSecurityOverviewRecommendations from './PlatformSecurityOverviewRecommendations';

export default function PlatformSecurityOverviewTab({ flow, onGoToAudit }) {
  const {
    kpis,
    recommendations,
    completedChecks,
    doneOpen,
    toggleDone,
    loginBars,
    recentEvents,
    handleAction,
  } = flow;

  const hasRecommendations = recommendations.length > 0;

  return (
    <div className="space-y-5">
      {/* Diqqat talab qiladi yoki Tizim himoyalangan banneri */}
      {hasRecommendations ? (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-200 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm sm:text-base mr-2">Diqqat talab qiladi</span>
            <span className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              {recommendations.length} ta xavfsizlik tavsiyasi mavjud
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-200 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm sm:text-base mr-2">Tizim holati yaxshi</span>
            <span className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
              Barcha asosiy xavfsizlik talablari bajarilgan
            </span>
          </div>
        </div>
      )}

      {/* 4 ta KPI Kartochkalari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Faol seanslar</span>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.activeSessions.count}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpis.activeSessions.sub}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Muvaffaqiyatsiz urinish</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.failedLogins.count}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpis.failedLogins.sub}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Yangi qurilmadan</span>
            <Smartphone className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.newDevices.count}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpis.newDevices.sub}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">2FA holati</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.twoFactorEnabled.count}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpis.twoFactorEnabled.sub}</p>
        </div>
      </div>

      {/* 2 ustunli asosiy kontent */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <PlatformSecurityOverviewRecommendations
            recommendations={recommendations}
            completedChecks={completedChecks}
            doneOpen={doneOpen}
            toggleDone={toggleDone}
            handleAction={handleAction}
          />
        </div>

        <div className="lg:col-span-5 space-y-5">
          {/* Kirishlar grafigi */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Kirishlar · oxirgi 7 kun
              </h2>
            </div>

            {loginBars.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <BarChart2 className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
                <span>Statistika API tayyor bo‘lganda ko‘rinadi</span>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2 h-36 pt-6 border-b border-slate-100 dark:border-slate-800">
                {loginBars.map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-slate-400 font-medium">{bar.total}</span>
                    <div className="w-full max-w-[28px] flex flex-col items-center">
                      {bar.failHeight > 0 && (
                        <div className="w-full bg-rose-500 rounded-t-sm" style={{ height: `${bar.failHeight}px` }} />
                      )}
                      <div className="w-full bg-emerald-700 rounded-b-sm" style={{ height: `${bar.okHeight}px` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">{bar.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* So'nggi hodisalar */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                So‘nggi hodisalar
              </h2>
              <button
                type="button"
                onClick={onGoToAudit}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1"
              >
                <span>Jurnalga o‘tish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <Inbox className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                <span>So‘nggi xavfsizlik hodisalari mavjud emas</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="py-2.5 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <LogIn className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{evt.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{evt.meta}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{evt.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
