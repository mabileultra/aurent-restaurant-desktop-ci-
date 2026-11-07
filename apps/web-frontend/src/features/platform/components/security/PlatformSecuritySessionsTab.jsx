import React from 'react';
import { Monitor, Smartphone, Radio, ShieldAlert } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';
import { resolveAttemptBadge } from '../../utils/securityFormatUtils';

const ATTEMPT_FILTERS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'ok', label: 'Muvaffaqiyatli' },
  { id: 'fail', label: 'Muvaffaqiyatsiz' },
  { id: 'blocked', label: 'Bloklangan' },
];

export default function PlatformSecuritySessionsTab({ flow }) {
  const { sessions, attempts, filter, setFilter, requestCloseAllOthers } = flow;

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Faol seanslar</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {sessions.length} ta
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Hozirda tizimga ulangan qurilmalar va brauzerlar</p>
          </div>
          {sessions.length > 1 && (
            <div className="flex items-center gap-2">
              <BaseButton variant="secondary" disabled className="text-xs font-semibold text-rose-600 opacity-60" onClick={requestCloseAllOthers}>
                Boshqa barcha seanslarni yopish
              </BaseButton>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">Tez kunda</span>
            </div>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Faol seanslar ma’lumotlari mavjud emas</span>
            <p className="text-slate-400 text-[11px] mt-0.5">Seanslar monitoringi API ishga tushganda bu yerda ko‘rinadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {sessions.map((sess) => {
              const isPhone = sess.deviceType === 'phone';
              return (
                <div key={sess.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        {isPhone ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{sess.device}</span>
                          {sess.current && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Hozirgi seans
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{sess.who}</p>
                        <p className="text-xs text-slate-500 mt-1">{sess.where}</p>
                      </div>
                    </div>
                    {!sess.current && (
                      <span className="text-[11px] text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Tez kunda</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">{sess.when}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Kirishlar jurnali</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {attempts.length > 0 ? `${attempts.length} ta yozuv ko‘rsatilmoqda` : 'Kirish urinishlari ro‘yxati'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {ATTEMPT_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? 'bg-emerald-900 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Kirishlar tarixi mavjud emas</span>
            <p className="text-slate-400 text-[11px] mt-0.5">Kirish hodisalari API ulanganda ushbu jadvalda paydo bo‘ladi</p>
          </div>
        ) : (
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold" style={{ backgroundColor: b.bg, color: b.color }}>
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
        )}
      </div>
    </div>
  );
}
