import React from 'react';
import { Clock, Globe, Trash2 } from 'lucide-react';

export default function PlatformSecuritySessionIpRulesCard({
  rules,
  setConc,
  toggleNotify,
  toggleIpOn,
  newIpAddr,
  setNewIpAddr,
  addIp,
  removeIp,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-700" />
          <span>Faolsizlik va seanslar</span>
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Bir vaqtda ruxsat etilgan seanslar</span>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {[1, 2, 3, 5].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConc(c)}
                  className={`flex-1 py-1 font-bold rounded-md ${
                    rules.conc === c
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {c} ta
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <span>Yangi qurilmadan kirganda email ogohlantirish</span>
            <input
              type="checkbox"
              checked={rules.notify}
              onChange={toggleNotify}
              className="rounded text-emerald-700"
            />
          </label>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>IP oq ro‘yxati</span>
          </h3>
          <button
            type="button"
            onClick={toggleIpOn}
            className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
              rules.ipOn ? 'bg-emerald-700' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                rules.ipOn ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className={`space-y-2 ${rules.ipOn ? '' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newIpAddr}
              onChange={(e) => setNewIpAddr(e.target.value)}
              placeholder="Masalan, 195.158.8.40"
              className="flex-1 px-2.5 py-1 text-xs border rounded-lg dark:bg-slate-800 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={addIp}
              className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Qo‘shish
            </button>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {rules.ips.map((ip, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-1.5 bg-slate-50 dark:bg-slate-800 rounded"
              >
                <span className="font-mono text-[11px]">
                  {ip.addr} <span className="text-slate-400">({ip.note})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeIp(idx)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
