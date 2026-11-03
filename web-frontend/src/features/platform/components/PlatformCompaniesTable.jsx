import React, { useState } from 'react';
import toast from 'react-hot-toast';
import TablePagination from '../../../components/shared/TablePagination';
import { useGeoNameLookup } from '../../shared/geo/useGeoNameLookup';
import { PlatformErrorState, Spinner } from '../../../components/ui';
import PlatformCompaniesTableHeader from './PlatformCompaniesTableHeader';
import PlatformCompaniesTableRow from './PlatformCompaniesTableRow';
import PlatformCompanyMobileCard from './PlatformCompanyMobileCard';

export default function PlatformCompaniesTable({
  t,
  isPending,
  isRefreshing = false,
  showOverlay = false,
  isError = false,
  error = null,
  onRetry,
  rows = [],
  page = 0,
  displayPage,
  pageSize = 14,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onToggleActive,
  onSelectCompany,
  statusFilter = 'ALL',
}) {
  const [copiedId, setCopiedId] = useState(null);
  const effectivePage = typeof displayPage === 'number' ? displayPage : page;
  const safeTotalPages = Math.max(
    totalPages || 0,
    pageSize > 0 && total > 0 ? Math.ceil(total / pageSize) : 1
  );
  const regionCodes = rows.map((r) => r.regionCode).filter(Boolean);
  const { regionName, districtName } = useGeoNameLookup(regionCodes);

  const handleCopyLoginCode = (e, code, id) => {
    e.stopPropagation();
    if (!code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(t('platform.loginCodeCopied', { defaultValue: 'Kirish kodi nusxalandi' }));
  };

  const getEmptyMessage = () => {
    if (statusFilter === 'INACTIVE') {
      return t('platform.noInactiveCompanies', { defaultValue: 'Nofaol kompaniyalar mavjud emas' });
    }
    if (statusFilter === 'ACTIVE') {
      return t('platform.noActiveCompanies', { defaultValue: 'Faol kompaniyalar mavjud emas' });
    }
    return t('platform.noCompanies', { defaultValue: 'Kompaniyalar topilmadi' });
  };

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
          <PlatformCompaniesTableHeader t={t} />
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              Array.from({ length: Math.min(pageSize || 14, 14) }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse motion-reduce:animate-none">
                  <td className="w-12 px-3 py-3 text-center">
                    <div className="h-4 w-5 mx-auto rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/60 shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700/60" />
                        <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700/60" />
                      <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700/60" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-700/60" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-slate-700/60" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700/60" /></td>
                  <td className="w-12 px-4 py-3 text-center"><div className="h-6 w-6 mx-auto rounded bg-slate-200 dark:bg-slate-700/60" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-4 py-8">
                  <PlatformErrorState size="sm" error={error} onRetry={onRetry} retryLoading={isPending} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  {getEmptyMessage()}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <PlatformCompaniesTableRow
                  key={row.id}
                  row={row}
                  index={index}
                  effectivePage={effectivePage}
                  pageSize={pageSize}
                  copiedId={copiedId}
                  onCopyLoginCode={handleCopyLoginCode}
                  districtName={districtName}
                  regionName={regionName}
                  menuId={menuId}
                  onMenuOpenChange={onMenuOpenChange}
                  onSelectCompany={onSelectCompany}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleActive={onToggleActive}
                  t={t}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="md:hidden">
        {isPending ? (
          <div className="space-y-3 p-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4">
            <PlatformErrorState size="sm" error={error} onRetry={onRetry} retryLoading={isPending} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {getEmptyMessage()}
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {rows.map((row) => (
              <PlatformCompanyMobileCard
                key={row.id}
                row={row}
                copiedId={copiedId}
                onCopyLoginCode={handleCopyLoginCode}
                districtName={districtName}
                regionName={regionName}
                onSelectCompany={onSelectCompany}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      <TablePagination
        page={page}
        displayPage={effectivePage}
        pageSize={pageSize}
        total={total}
        totalPages={safeTotalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
