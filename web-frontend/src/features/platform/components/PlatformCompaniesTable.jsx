import { useState } from 'react';
import { Check, Copy, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { useGeoNameLookup } from '../../shared/geo/useGeoNameLookup';
import { PlatformErrorState, Spinner } from '../../../components/ui';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
  getCompanyPalette,
} from '../utils/companyAvatarUtils';

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
  onSelectCompany,
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

  return (
    <div className="admin-table-shell relative">
      {/* Indeterminate emerald progress line during background refetching */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-emerald-100 dark:bg-emerald-950 overflow-hidden">
          <div className="h-full bg-emerald-500 animate-pulse w-full motion-reduce:animate-none" />
        </div>
      )}

      {/* Anti-flicker delayed overlay spinner (appears only if request persists > 250ms, holds >= 400ms) */}
      {showOverlay && (
        <Spinner overlay size="sm" text={t('common.loading')} />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3 font-medium min-w-[220px]">
                {t('platform.colCompany', { defaultValue: 'Kompaniya' })}
              </th>
              <th className="px-4 py-3 font-medium min-w-[160px]">
                {t('platform.colLocation', { defaultValue: 'Manzil' })}
              </th>
              <th className="px-4 py-3 font-medium">{t('platform.colLoginCode')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colBranches', { defaultValue: 'Filiallar' })}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colBusinessType')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              /* Full-height skeleton rows preventing table height collapse on initial load */
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
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                  <td className="w-12 px-4 py-3 text-center">
                    <div className="h-6 w-6 mx-auto rounded bg-slate-200 dark:bg-slate-700/60" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-4 py-8">
                  <PlatformErrorState
                    size="sm"
                    error={error}
                    onRetry={onRetry}
                    retryLoading={isPending}
                  />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const initials = getCompanyInitials(row.name);
                const palette = getCompanyPalette(row.name, row.id);
                const badgeClass = getBusinessTypeBadgeClass(row.businessType);
                const branchMeta = getCompanyBranchMeta(row.businessType, t);
                const BranchIcon = branchMeta.icon;

                const district = districtName(row.districtCode);
                const region = regionName(row.regionCode);
                const hasLocation = Boolean(district || region);

                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectCompany?.(row)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <AdminTableNoIdCells page={effectivePage} pageSize={pageSize} index={index} id={row.id} />

                    {/* Company Identity (Avatar + Name + STIR / Phone) */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-2xs ${palette}`}
                          aria-hidden
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {row.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                            {row.tin ? (
                              <span className="font-mono">STIR: {row.tin}</span>
                            ) : null}
                            {row.tin && row.phone ? <span>·</span> : null}
                            {row.phone ? <span>{row.phone}</span> : null}
                            {!row.tin && !row.phone && row.legalName ? (
                              <span className="truncate">{row.legalName}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location (Combined District + Region) */}
                    <td className="px-4 py-3">
                      {hasLocation ? (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {district || region}
                          </div>
                          {district && region && district !== region ? (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {region}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Login code */}
                    <td className="px-4 py-3">
                      {row.loginCode ? (
                        <button
                          type="button"
                          onClick={(e) => handleCopyLoginCode(e, row.loginCode, row.id)}
                          className="group/btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-mono text-xs font-semibold text-slate-700 dark:text-slate-300"
                          title={t('common.copy', { defaultValue: 'Nusxalash' })}
                        >
                          <span>{row.loginCode}</span>
                          {copiedId === row.id ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} className="text-slate-400 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-200 transition-colors" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Branches count badge */}
                    <td className="px-4 py-3">
                      <Link
                        to={`/platform/stores?focusCompany=${row.id}#company-${row.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${branchMeta.badgeClass} transition-colors`}
                        title={branchMeta.tooltip}
                      >
                        <BranchIcon size={12} />
                        <span>{row.storeCount ?? 0}</span>
                      </Link>
                    </td>

                    {/* Business type */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}>
                        {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, { defaultValue: row.businessType })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          row.active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {row.active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <TableRowActionsMenu
                        open={menuId === row.id}
                        onOpenChange={(next) => onMenuOpenChange(next ? row.id : null)}
                        actions={[
                          {
                            label: t('platform.quickView', { defaultValue: 'Tezkor ko‘rish' }),
                            icon: Eye,
                            onClick: () => onSelectCompany?.(row),
                          },
                          {
                            label: t('common.edit'),
                            onClick: () => onEdit(row),
                          },
                          {
                            label: t('common.delete'),
                            danger: true,
                            onClick: () => onDelete(row),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
