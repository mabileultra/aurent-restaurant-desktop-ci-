import React from 'react';
import TablePagination from '../../../../components/shared/TablePagination';
import { AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { Spinner } from '../../../../components/ui';
import StoresTableRow from './StoresTableRow';
import PlatformStoreMobileCard from './PlatformStoreMobileCard';

export default function StoresTable({
  t,
  isPending,
  isRefreshing = false,
  showOverlay = false,
  rows,
  page,
  displayPage,
  pageSize,
  total,
  totalPages,
  showCompany = false,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onToggleActive,
  onDelete,
  onPharmacyIntegration,
  onSelectStore,
}) {
  const colSpan = showCompany ? 10 : 9;
  const effectivePage = typeof displayPage === 'number' ? displayPage : page;
  const regionCodes = rows.map((r) => r.regionCode).filter(Boolean);
  const { regionName, districtName, empty } = useGeoNameLookup(regionCodes);

  return (
    <div className="admin-table-shell relative">
      {/* Indeterminate emerald progress line during background refetching */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-emerald-100 dark:bg-emerald-950 overflow-hidden">
          <div className="h-full bg-emerald-500 animate-pulse w-full motion-reduce:animate-none" />
        </div>
      )}

      {/* Anti-flicker delayed overlay spinner */}
      {showOverlay && (
        <Spinner overlay size="sm" text={t('common.loading')} />
      )}

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3 font-medium">
                {showCompany ? t('platform.colBranchName', { defaultValue: 'Filial nomi' }) : t('stores.colName')}
              </th>
              {showCompany && (
                <th className="px-4 py-3 font-medium">{t('stores.colCompany')}</th>
              )}
              <th className="px-4 py-3 font-medium">{t('platform.colHudud', { defaultValue: 'Hudud' })}</th>
              <th className="px-4 py-3 font-medium">
                {showCompany ? t('platform.colBranchType', { defaultValue: 'Filial turi' }) : t('stores.colBusinessType')}
              </th>
              <th className="px-4 py-3 font-medium">{t('stores.colAddress')}</th>
              <th className="px-4 py-3 font-medium">{t('stores.colPhone')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colStatus', { defaultValue: 'Holat' })}</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              Array.from({ length: Math.min(pageSize || 10, 10) }).map((_, idx) => (
                <tr key={`store-skeleton-${idx}`} className="animate-pulse motion-reduce:animate-none">
                  <td className="w-12 px-3 py-3 text-center">
                    <div className="h-4 w-5 mx-auto rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="w-16 px-3 py-3 text-center">
                    <div className="h-4 w-8 mx-auto rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700/60 shrink-0" />
                      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700/60" />
                    </div>
                  </td>
                  {showCompany && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700/60" />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="w-12 px-4 py-3" />
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  {t('stores.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <StoresTableRow
                  key={row.id}
                  row={row}
                  index={index}
                  effectivePage={effectivePage}
                  pageSize={pageSize}
                  showCompany={showCompany}
                  regionName={regionName}
                  districtName={districtName}
                  empty={empty}
                  menuId={menuId}
                  onMenuOpenChange={onMenuOpenChange}
                  onSelectStore={onSelectStore}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onDelete={onDelete}
                  onPharmacyIntegration={onPharmacyIntegration}
                  t={t}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden p-3 space-y-3">
        {isPending ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={`m-skel-${idx}`} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/60" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700/60 rounded" />
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {t('stores.empty')}
          </div>
        ) : (
          rows.map((row) => (
            <PlatformStoreMobileCard
              key={row.id}
              row={row}
              regionName={regionName}
              districtName={districtName}
              onSelectStore={onSelectStore}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              onPharmacyIntegration={onPharmacyIntegration}
              t={t}
            />
          ))
        )}
      </div>

      <TablePagination
        page={page}
        displayPage={effectivePage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
