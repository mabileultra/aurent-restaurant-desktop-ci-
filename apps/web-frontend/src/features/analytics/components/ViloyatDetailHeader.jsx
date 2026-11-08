import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Layers } from 'lucide-react';

export default function ViloyatDetailHeader({
  padCode,
  regionName,
  meta,
  isDistrictView = false,
  districtCode = null,
  districtName = null,
  onClearDistrict = null,
}) {
  const isShahar = districtName?.toLowerCase().includes('shahar') || districtName?.toLowerCase().includes('sh.');
  const resolvedBadge = isDistrictView
    ? `${isShahar ? 'Shahar' : 'Tuman'} · kod ${districtCode}`
    : `Viloyat · kod ${padCode}`;
  const displayTitle = isDistrictView ? districtName : regionName;

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Joylashuv" className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
        <Link
          to="/platform/analytics/viloyatlar"
          className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline min-h-[44px]"
        >
          <ChevronLeft size={16} />
          Tumanlar
        </Link>
        <span className="text-slate-400">/</span>
        {isDistrictView ? (
          <>
            <Link
              to={`/platform/analytics/viloyatlar/${padCode}`}
              onClick={onClearDistrict}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {regionName}
            </Link>
            <span className="text-slate-400">/</span>
            <span aria-current="page" className="font-semibold text-slate-800 dark:text-slate-200">
              {districtName}
            </span>
          </>
        ) : (
          <span aria-current="page" className="font-semibold text-slate-800 dark:text-slate-200">
            {regionName}
          </span>
        )}
      </nav>

      {/* Main Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {resolvedBadge}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {displayTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {meta}
          </p>
        </div>

        {isDistrictView ? (
          <Link
            to={`/platform/analytics/viloyatlar/${padCode}`}
            onClick={onClearDistrict}
            className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
          >
            <Layers size={16} />
            Viloyat ko‘rinishi
          </Link>
        ) : (
          <Link
            to="/platform/analytics/viloyatlar"
            className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs"
          >
            <Layers size={16} />
            Barcha tumanlar
          </Link>
        )}
      </div>
    </div>
  );
}
