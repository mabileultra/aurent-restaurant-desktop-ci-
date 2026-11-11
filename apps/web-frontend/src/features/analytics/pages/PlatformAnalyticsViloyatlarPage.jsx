import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import ChromaGridContainer from '../components/ChromaGridContainer';
import RubberSegment from '../../../components/ui/rubber-segment/RubberSegment';
import { useViloyatlarAnalytics } from '../hooks/useViloyatlarAnalytics';
import ViloyatlarKpiCards from '../components/ViloyatlarKpiCards';
import ViloyatlarFilterBar from '../components/ViloyatlarFilterBar';
import { ViloyatActiveCard, ViloyatEmptyCard, ViloyatUnassignedCard } from '../components/ViloyatCard';

const PERIODS = [
  { id: 'today', label: 'Bugun' },
  { id: '7d', label: '7 kun' },
  { id: '30d', label: '30 kun' },
  { id: 'month', label: 'Shu oy' },
  { id: 'year', label: 'Yil' },
];

export default function PlatformAnalyticsViloyatlarPage() {
  const {
    period,
    setPeriod,
    rangeLabel,
    kpis,
    filter,
    setFilter,
    counts,
    sort,
    setSort,
    regions,
    unassigned,
    totalCompanies,
    loading,
    error,
    refetch,
  } = useViloyatlarAnalytics();

  return (
    <div className="min-h-screen bg-[#F3F6F4] dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Samarqand viloyati tumanlari
              </h1>
              {loading ? (
                <RefreshCw size={18} className="animate-spin text-emerald-600" />
              ) : null}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              16 ta tuman va shahar · {totalCompanies} korxona{unassigned.companies > 0 ? ` (${totalCompanies - unassigned.companies} tasi tumanlarga taqsimlangan)` : ''}. Batafsil ko‘rish uchun tumanni tanlang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector — physics off to avoid freeze on heavy analytics refetch */}
            <RubberSegment
              items={PERIODS.map((p) => ({ value: p.id, label: p.label }))}
              value={period}
              onChange={(val) => setPeriod(val)}
              size="sm"
              radius={10}
              inset={3}
              physics={false}
              draggable={false}
              trackColor="#f1f5f9"
              thumbColor="#ffffff"
              textColor="#64748b"
              activeTextColor="#006847"
              className="backdrop-blur-xl border border-slate-200/80 shadow-xs"
              aria-label="Davrni tanlash"
            />

            {/* Date range display */}
            <div className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200/80 bg-white/85 text-xs font-medium text-slate-700 backdrop-blur-xl shadow-xs">
              <Calendar size={14} className="text-emerald-600 shrink-0" />
              <span>{rangeLabel}</span>
            </div>
          </div>
        </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>Ma’lumotlarni yuklashda xatolik yuz berdi.</span>
          <button
            type="button"
            onClick={refetch}
            className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg font-medium text-xs shadow-xs hover:bg-slate-50 cursor-pointer"
          >
            Qayta urinish
          </button>
        </div>
      ) : null}

      {/* KPI Cards */}
      <ViloyatlarKpiCards kpis={kpis} />

      {/* Filter and Sort Toolbar */}
      <ViloyatlarFilterBar
        filter={filter}
        setFilter={setFilter}
        counts={counts}
        sort={sort}
        setSort={setSort}
      />

      {/* Regions Grid with Chroma Spotlight */}
      <ChromaGridContainer radius={300} softness={0.65} glow={0.6} borderGlow={1}>
        <section
          aria-label="Tumanlar ro‘yxati"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {regions.map((region) => (
            region.hasCompanies ? (
              <ViloyatActiveCard key={region.code} region={region} />
            ) : (
              <ViloyatEmptyCard key={region.code} region={region} />
            )
          ))}

          {filter !== 'empty' && unassigned.companies > 0 ? (
            <ViloyatUnassignedCard unassigned={unassigned} />
          ) : null}
        </section>
      </ChromaGridContainer>

        {/* Footnote */}
        <footer className="pt-4 border-t border-slate-200 text-xs text-slate-400">
          Aylanma — fiskal va nofiskal savdolar yig‘indisi. Foiz — oldingi teng davrga nisbatan o‘zgarish. Fiskal ulush — aylanmaning fiskal chek bilan o‘tgan qismi.
        </footer>
    </div>
  );
}
