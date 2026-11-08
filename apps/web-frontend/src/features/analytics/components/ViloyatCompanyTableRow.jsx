import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCompact } from '../utils/viloyatDetailUtils';

export default function ViloyatCompanyTableRow({ row, targetUrl }) {
  const navigate = useNavigate();

  const handleRowClick = (e) => {
    // Agar foydalanuvchi to'g'ridan-to'g'ri <a> tegi yoki uning ichidagi ikonkani bossa,
    // brauzer/router o'zining tabiiy navigatsiyasini bajaradi
    if (e.target.closest('a')) return;
    navigate(targetUrl);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(targetUrl);
    }
  };

  return (
    <tr
      tabIndex={0}
      role="link"
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors focus:outline-hidden focus:bg-slate-50 dark:focus:bg-slate-800/50"
    >
      <td className="py-3 pl-5 pr-2 text-slate-400 font-mono tabular-nums">{row.rowNumber}</td>
      <td className="py-3 px-2 max-w-[240px]">
        <Link
          to={targetUrl}
          className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 hover:underline block truncate transition-colors"
        >
          {row.name}
        </Link>
      </td>
      <td className="py-3 px-2 font-mono tabular-nums text-slate-600 dark:text-slate-400">{row.tin}</td>
      <td className="py-3 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.district}</td>
      <td className="py-3 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.type}</td>
      <td className="py-3 px-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
            row.isConnected
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {row.isConnected ? 'Ulangan' : 'Ulanmagan'}
        </span>
      </td>
      <td className="py-3 px-2 text-right font-mono tabular-nums">
        <span className={row.turnover30d > 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-400'}>
          {formatCompact(row.turnover30d)} so‘m
        </span>
      </td>
      <td className="py-3 px-2 text-right font-mono tabular-nums">
        {row.isDeltaUp != null ? (
          <span
            className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-xs font-semibold ${
              row.isDeltaUp
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {row.deltaText}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="py-3 pr-5 pl-2 text-right">
        <Link
          to={targetUrl}
          aria-label={`${row.name} — batafsil ochish`}
          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-slate-800 transition"
        >
          <ChevronRight size={18} />
        </Link>
      </td>
    </tr>
  );
}
