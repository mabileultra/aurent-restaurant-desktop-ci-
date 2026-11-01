import React, { useState, useMemo } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { MOCK_HISTORY_DATA } from '../mock/accessRightsUsersData';

export default function PermissionHistoryTab() {
  const [historyList, setHistoryList] = useState(MOCK_HISTORY_DATA);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
  const [actionFilter, setActionFilter] = useState('ALL'); // 'ALL' | 'SHABLON' | 'ISTISNO' | 'NUSXA' | 'OMMAVIY'
  const [expandedIds, setExpandedIds] = useState(() => new Set([101]));

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return historyList.filter((item) => {
      if (actionFilter !== 'ALL' && item.actionType !== actionFilter) return false;
      if (q) {
        const match =
          item.title.toLowerCase().includes(q) ||
          item.actor.toLowerCase().includes(q) ||
          (item.comment && item.comment.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [historyList, search, actionFilter]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRollback = (id, title) => {
    toast.success(`O‘zgarish muvaffaqiyatli qaytarildi (Rollback): ${title}`);
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Xodim, shablon yoki modul..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {['Bugun', '7 kun', '30 kun'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  range === r
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {[
              { id: 'ALL', label: `Barcha amallar ${historyList.length}` },
              { id: 'SHABLON', label: 'Shablon 2' },
              { id: 'ISTISNO', label: 'Istisno 1' },
              { id: 'NUSXA', label: 'Nusxa 1' },
              { id: 'OMMAVIY', label: 'Ommaviy 1' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActionFilter(f.id)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  actionFilter === f.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline entries */}
      <div className="space-y-4">
        {filteredHistory.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                    {item.time}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {item.actorInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.actor} {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.actionType}
                      </span>
                      {item.tags?.map((t, idx) => (
                        <span key={idx} className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t}
                        </span>
                      ))}
                      <span className="text-[11px] text-slate-400">· {item.affectedCount} xodimga ta‘sir qildi</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <span>Tafsilot</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRollback(item.id, item.title)}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                  >
                    <RotateCcw size={12} />
                    <span>Qaytarish</span>
                  </button>
                </div>
              </div>

              {isExpanded && item.changes?.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-850">
                  {item.changes.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          c.type === 'ADDED'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : c.type === 'REMOVED'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {c.type === 'ADDED' ? '+ Yoqildi' : c.type === 'REMOVED' ? '− O‘chirildi' : 'Qo‘llandi'}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.moduleName}
                      </span>
                      {c.group && <span className="text-slate-400">({c.group})</span>}
                    </div>
                  ))}
                  {item.comment && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                      Izoh: {item.comment}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
