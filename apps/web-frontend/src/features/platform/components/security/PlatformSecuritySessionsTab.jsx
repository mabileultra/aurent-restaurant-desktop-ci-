import React from 'react';
import { Monitor, Smartphone, Shield, LogOut } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { resolveAttemptBadge } from '../../utils/securityFormatUtils';

const ATTEMPT_FILTERS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'ok', label: 'Muvaffaqiyatli' },
  { id: 'fail', label: 'Muvaffaqiyatsiz' },
  { id: 'blocked', label: 'Bloklangan' },
];

export default function PlatformSecuritySessionsTab({ flow }) {
  const {
    sessions,
    attempts,
    filter,
    setFilter,
    requestCloseSession,
    requestCloseAllOthers,
  } = flow;

  return (
    <div className="space-y-6">
      {/* 1. Faol seanslar bloki */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Faol seanslar</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {sessions.length} ta
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hozirda tizimga ulangan barcha qurilmalar va brauzerlar
            </p>
          </div>
          {sessions.length > 1 && (
            <BaseButton
              variant="secondary"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 self-start sm:self-center"
              onClick={requestCloseAllOthers}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Boshqa barcha seanslarni yopish
            </BaseButton>
          )}
        </div>

        {/* Seans kartalari */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {sessions.map((sess) => {
            const isPhone = sess.deviceType === 'phone';
            return (
              <div
                key={sess.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between gap-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {isPhone ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sess.device}
                        </span>
                        {sess.current && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Hozirgi seans
                          </span>
                        )}
                        {sess.isNew && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Yangi qurilma
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        {sess.who}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{sess.where}</p>
                    </div>
                  </div>

                  {!sess.current && (
                    <button
                      type="button"
                      onClick={() => requestCloseSession(sess)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Seansni yopish
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  {sess.when}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Kirishlar jurnali */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Kirishlar jurnali
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {attempts.length} ta yozuv ko‘rsatilmoqda · oxirgi 7 kunda jami 74 ta kirish
            </p>
          </div>

          {/* Filtrlar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ATTEMPT_FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-emerald-900 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Jadval */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Vaqt</th>
                <th className="py-2.5 px-3">Xodim / Login</th>
                <th className="py-2.5 px-3">Natija</th>
                <th className="py-2.5 px-3">IP va Joylashuv</th>
                <th className="py-2.5 px-3">Qurilma / Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attempts.map((row) => {
                const b = resolveAttemptBadge(row.status);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{row.time}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{row.who}</div>
                      <div className="text-[11px] text-slate-400">{row.login}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold"
                        style={{ backgroundColor: b.bg, color: b.color }}
                      >
                        {b.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-700 dark:text-slate-300">{row.ip}</div>
                      <div className="text-[11px] text-slate-400">{row.geo}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-800 dark:text-slate-200">{row.device}</div>
                      <div className="text-[11px] text-slate-400">{row.note}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
