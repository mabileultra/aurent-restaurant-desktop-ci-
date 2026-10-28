import { useState } from 'react';
import { Check, Copy, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { useGeoNameLookup } from '../../shared/geo/useGeoNameLookup';
import { PlatformErrorState } from '../../../components/ui';

export default function PlatformCompaniesTable({
  t,
  isPending,
  isError = false,
  error = null,
  onRetry,
  rows,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  menuId,
  onMenuOpenChange,
  onEdit,
  onDelete,
}) {
  const [copiedId, setCopiedId] = useState(null);
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
    <div className="admin-table-shell">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3 font-medium">{t('platform.colName')}</th>
              <th className="px-4 py-3 font-medium">{t('geo.region')}</th>
              <th className="px-4 py-3 font-medium">{t('geo.district')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colLoginCode')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colStores')}</th>
              <th className="px-4 py-3 font-medium">{t('platform.colBusinessType')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={10} className="px-4 py-8">
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
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{regionName(row.regionCode)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{districtName(row.districtCode)}</td>
                  <td className="px-4 py-3">
                    {row.loginCode ? (
                      <button
                        type="button"
                        onClick={(e) => handleCopyLoginCode(e, row.loginCode, row.id)}
                        className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-mono text-xs font-semibold text-slate-700 dark:text-slate-300"
                        title={t('common.copy', { defaultValue: 'Nusxalash' })}
                      >
                        <span>{row.loginCode}</span>
                        {copiedId === row.id ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/platform/stores?companyId=${row.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
                      title={t('platform.viewCompanyStores', { defaultValue: 'Do‘konlarni ko‘rish' })}
                    >
                      <Store size={12} />
                      <span>{row.storeCount ?? 0}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, { defaultValue: row.businessType })}
                    </span>
                  </td>
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
                  <td className="px-4 py-3">
                    <TableRowActionsMenu
                      open={menuId === row.id}
                      onOpenChange={(next) => onMenuOpenChange(next ? row.id : null)}
                      actions={[
                        { label: t('common.edit'), onClick: () => onEdit(row) },
                        {
                          label: t('common.delete'),
                          danger: true,
                          onClick: () => onDelete(row),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={safeTotalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
