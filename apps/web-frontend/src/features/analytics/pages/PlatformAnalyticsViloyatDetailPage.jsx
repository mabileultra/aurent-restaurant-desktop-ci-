import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, LayoutGrid } from 'lucide-react';
import { geoApi } from '../../../api/geo.api';
import { analyticsApi } from '../api/analyticsApi';

export default function PlatformAnalyticsViloyatDetailPage() {
  const { regionCode } = useParams();
  const padCode = String(regionCode || '').padStart(2, '0');

  const { data: regions = [] } = useQuery({
    queryKey: ['geo-regions'],
    queryFn: () => geoApi.regions().then((r) => r.data || []),
    staleTime: 600_000,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['geo-districts', padCode],
    queryFn: () => geoApi.districts(padCode).then((r) => r.data || []),
    enabled: Boolean(padCode),
    staleTime: 600_000,
  });

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview-viloyatlar-detail'],
    queryFn: () => analyticsApi.getOverview({ period: '30d' }).then((r) => r.data),
    staleTime: 60_000,
  });

  const currentRegion = regions.find((r) => String(r.code).padStart(2, '0') === padCode);
  const regionName = currentRegion?.nameUz || currentRegion?.nameRu || `Viloyat (${padCode})`;

  const overviewRegion = (overview?.regions || []).find(
    (r) => String(r.code || r.regionCode).padStart(2, '0') === padCode
  );
  const companies = Number(overviewRegion?.enterprises ?? 0);
  const connected = Number(overviewRegion?.connected ?? 0);
  const districtsCount = districts.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Joylashuv" className="flex items-center gap-2 text-xs sm:text-sm">
        <Link
          to="/platform/analytics/viloyatlar"
          className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ChevronLeft size={16} />
          Viloyatlar
        </Link>
        <span className="text-slate-400">/</span>
        <span aria-current="page" className="font-semibold text-slate-700 dark:text-slate-300">
          {regionName}
        </span>
      </nav>

      {/* Header Info */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {regionName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {companies} korxona · {connected} ulangan · {districtsCount > 0 ? `${districtsCount} ta tuman va shahar` : 'Tumanlar ma’lumoti'}
        </p>
      </div>

      {/* Stage-2 Placeholder Matching Prototype */}
      <section className="min-h-[380px] border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3 p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <LayoutGrid size={24} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
          2-sahifa shu yerda bo‘ladi
        </h2>
        <p className="max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Tarkibi keyingi bosqichda kelishiladi. Hozircha bu sahifa viloyat kartasi bosilganda qayerga o‘tishini ko‘rsatadi.
        </p>
        <Link
          to="/platform/analytics/viloyatlar"
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
        >
          <ChevronLeft size={16} />
          Orqaga qaytish
        </Link>
      </section>
    </div>
  );
}
