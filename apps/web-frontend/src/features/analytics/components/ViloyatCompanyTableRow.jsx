import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatCompact } from '../utils/viloyatDetailUtils';

export default function ViloyatCompanyTableRow({ row, targetUrl }) {
  const navigate = useNavigate();

  const isTuple = Array.isArray(row);
  const rowData = isTuple
    ? {
        rowNumber: '—',
        name: row[1] || '—',
        tin: row[2] && row[2] !== '_' ? row[2] : '—',
        district: row[3] || '—',
        type: row[4] || '—',
        isConnected: row[5] === 1,
        turnover30d: Number(row[7] || 0),
        deltaText: '—',
        isDeltaUp: null,
      }
    : (row || {});

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
      <td className="py-3 pl-5 pr-2 text-slate-400 font-mono tabular-nums">{rowData.rowNumber}</td>
      <td className="py-3 px-2 max-w-[240px]">
        <Link
          to={targetUrl}
          className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 hover:underline block truncate transition-colors"
        >
          {rowData.name}
        </Link>
      </td>
      <td className="py-3 px-2 font-mono tabular-nums text-slate-600 dark:text-slate-400">{rowData.tin}</td>
      <td className="py-3 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{rowData.district}</td>
      <td className="py-3 px-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{rowData.type}</td>
      <td className="py-3 px-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
            rowData.isConnected
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {rowData.isConnected ? 'Ulangan' : 'Ulanmagan'}
        </span>
      </td>
      <td className="py-3 px-2 text-right font-mono tabular-nums">
        <span className={rowData.turnover30d > 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-400'}>
          {formatCompact(rowData.turnover30d)} so‘m
        </span>
      </td>
      <td className="py-3 px-2 text-right font-mono tabular-nums">
        {rowData.isDeltaUp != null ? (
          <span
            className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-xs font-semibold ${
              rowData.isDeltaUp
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {rowData.deltaText}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="py-3 pr-5 pl-2 text-right">
        <Link
          to={targetUrl}
          aria-label={`${rowData.name} — batafsil ochish`}
          className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-slate-800 transition"
        >
          <ChevronRight size={18} />
        </Link>
      </td>
    </tr>
  );
}
