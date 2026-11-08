import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Layers } from 'lucide-react';

export default function ViloyatDetailHeader({ padCode, regionName, meta }) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Joylashuv" className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          to="/platform/analytics/viloyatlar"
          className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline min-h-[44px]"
        >
          <ChevronLeft size={16} />
          Viloyatlar
        </Link>
        <span className="text-slate-400">/</span>
        <span aria-current="page" className="font-semibold text-slate-800 dark:text-slate-200">
          {regionName}
        </span>
      </nav>

      {/* Main Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            Viloyat · kod {padCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {regionName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {meta}
          </p>
        </div>

        <Link
          to="/platform/analytics/viloyatlar"
          className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
        >
          <Layers size={16} />
          Boshqa viloyat
        </Link>
      </div>
    </div>
  );
}
