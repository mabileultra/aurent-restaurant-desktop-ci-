import React from 'react';
import { ExternalLink, History } from 'lucide-react';
import { AUDIT_MODULES } from '../../utils/securityConstants';

export default function PlatformSecurityAuditTab({ flow }) {
  const {
    selectedModule,
    setSelectedModule,
    filteredRows,
    selectedItem,
    selectedId,
    selectRow,
  } = flow;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        {AUDIT_MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedModule(m.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              selectedModule === m.id
                ? 'bg-emerald-900 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <History className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 block">
            Harakatlar jurnali bo‘sh
          </span>
          <p className="text-slate-400 text-xs mt-1">
            Platforma xodimlari harakatlari monitoringi API ulanganda bu yerda aks etadi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500">
              {filteredRows.length} ta yozuv
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
              {filteredRows.map((row) => {
                const isSelected = row.id === selectedId;
                return (
                  <div
                    key={row.id}
                    onClick={() => selectRow(row.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-l-4 border-l-emerald-700'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: row.personBg, color: row.personFg }}
                    >
                      {row.personInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{row.personName}</span>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{row.time}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">{row.action}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {row.moduleName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5">
            {selectedItem ? (
              <div className="sticky top-4 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-1">
                    {selectedItem.moduleName}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{selectedItem.action}</h3>
                </div>

                <div className="space-y-1.5 text-xs border-y border-slate-100 dark:border-slate-800 py-3">
                  <div className="flex justify-between"><span className="text-slate-400">Xodim:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{selectedItem.personName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Vaqt:</span><span className="font-mono text-slate-700 dark:text-slate-300">{selectedItem.fullTime}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Manba:</span><span className="text-slate-700 dark:text-slate-300 text-right max-w-[200px] truncate">{selectedItem.from}</span></div>
                </div>

                {selectedItem.diff && selectedItem.diff.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">O‘zgarishlar farqi</h4>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[11px]">
                          <tr><th className="py-1 px-2">Maydon</th><th className="py-1 px-2">Avval</th><th className="py-1 px-2">Keyin</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedItem.diff.map((d, idx) => (
                            <tr key={idx}>
                              <td className="py-1 px-2 font-medium text-slate-700 dark:text-slate-300">{d.field}</td>
                              <td className="py-1 px-2 text-slate-400 line-through">{d.before}</td>
                              <td className="py-1 px-2 font-semibold text-emerald-700 dark:text-emerald-400">{d.after}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedItem.linkText && (
                  <div className="pt-2">
                    <button type="button" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <span>{selectedItem.linkText}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
