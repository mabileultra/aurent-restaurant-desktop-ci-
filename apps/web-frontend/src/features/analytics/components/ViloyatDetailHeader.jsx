import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Layers } from 'lucide-react';
import ViloyatHeroBackground from './ViloyatHeroBackground';
import { formatCompact, formatPercent } from '../utils/viloyatDetailUtils';

const SUBTITLES = {
  A: (isDistrict) => (isDistrict ? 'Barcha faoliyat turlari · Hudud bo‘yicha jami' : 'Barcha faoliyat turlari · 16 ta tuman va shahar'),
  F: () => 'Oziq-ovqat, supermarket va savdo do‘konlari',
  R: () => 'Restoranlar, kafelar va umumiy ovqatlanish maskanlari',
  P: () => 'Dorixonalar va farmatsevtika muassasalari',
  O: () => 'Universal, qurilish va boshqa turdagi korxonalar',
};

const BADGES = {
  A: (isDistrict, distCode, padCode, isShahar) =>
    isDistrict ? `${isShahar ? 'Shahar' : 'Tuman'} · kod ${distCode}` : `Viloyat · kod ${padCode}`,
  F: () => 'Oziq-ovqat korxonalari',
  R: () => 'Restoranlar va kafelar',
  P: () => 'Dorixonalar',
  O: () => 'Boshqa korxonalar',
};

export default function ViloyatDetailHeader({
  padCode,
  regionName,
  meta,
  isDistrictView = false,
  districtCode = null,
  districtName = null,
  onClearDistrict = null,
  activeType = 'A',
  types = [],
  onSelectType = () => {},
  turnover = {},
  currentTypeConfig = {},
  connPercent = 0,
}) {
  const isShahar = districtName?.toLowerCase().includes('shahar') || districtName?.toLowerCase().includes('shahr') || districtName?.toLowerCase().includes('sh.');
  const badgeResolver = BADGES[activeType] || BADGES.A;
  const resolvedBadge = badgeResolver(isDistrictView, districtCode, padCode, isShahar);
  const subtitleResolver = SUBTITLES[activeType] || SUBTITLES.A;
  const resolvedSubtitle = subtitleResolver(isDistrictView);
  const displayTitle = isDistrictView ? districtName : regionName;

  return (
    <header className="relative rounded-2xl overflow-hidden bg-slate-950 text-white shadow-xl border border-slate-800/80">
      {/* Background with dynamic image or composite strips */}
      <ViloyatHeroBackground activeType={activeType} />

      {/* Hero content overlay */}
      <div className="relative z-10 p-5 sm:p-7 space-y-6">
        {/* Top Breadcrumb & Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Joylashuv" className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <Link
              to="/platform/analytics/viloyatlar"
              className="inline-flex items-center gap-1 font-medium text-slate-200 hover:text-white transition"
            >
              <ChevronLeft size={16} />
              Viloyatlar
            </Link>
            <span className="text-slate-500">/</span>
            {isDistrictView ? (
              <>
                <Link
                  to={`/platform/analytics/viloyatlar/${padCode}`}
                  onClick={onClearDistrict}
                  className="font-medium text-slate-200 hover:text-white transition"
                >
                  {regionName}
                </Link>
                <span className="text-slate-500">/</span>
                <span className="font-semibold text-white">{districtName}</span>
              </>
            ) : (
              <span className="font-semibold text-white">{regionName}</span>
            )}
          </nav>

          <Link
            to={isDistrictView ? `/platform/analytics/viloyatlar/${padCode}` : '/platform/analytics/viloyatlar'}
            onClick={isDistrictView ? onClearDistrict : undefined}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md text-xs font-semibold border border-white/10 transition shadow-xs"
          >
            <Layers size={14} />
            {isDistrictView ? 'Viloyat ko‘rinishi' : 'Barcha tumanlar'}
          </Link>
        </div>

        {/* Title, Badge and Subtitle */}
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-md border border-white/10">
            {resolvedBadge}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-xs">
            {displayTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            {resolvedSubtitle}
          </p>
        </div>

        {/* 3 Translucent Stats Pills */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <div className="bg-slate-900/75 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 min-w-[120px] shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Korxonalar</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">{currentTypeConfig?.n ?? 0}</span>
          </div>
          <div className="bg-slate-900/75 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 min-w-[140px] shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Ulangan</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">{currentTypeConfig?.c ?? 0} ta · {formatPercent(connPercent)}</span>
          </div>
          <div className="bg-slate-900/75 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 min-w-[170px] shadow-sm">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Aylanma · 30 kun</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">{formatCompact(turnover?.m30 ?? turnover?.all ?? 0)} so‘m</span>
          </div>
        </div>

        {/* Integrated Bottom Tabs Bar */}
        {types.length > 0 && (
          <div
            role="group"
            aria-label="Faoliyat turi bo‘yicha ajratish"
            className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-lg border border-slate-200/80 dark:border-slate-800"
          >
            {types.map((t) => {
              const isActive = t.id === activeType;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelectType(t.id)}
                  className={`flex-1 min-w-[120px] sm:min-w-[140px] h-11 px-3 sm:px-4 rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`min-w-6 h-5 px-1.5 rounded-full inline-flex items-center justify-center text-xs font-bold tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {t.n}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
