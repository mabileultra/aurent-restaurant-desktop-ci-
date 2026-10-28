import React from 'react';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import TablePagination from '../../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { storeIsPharmacy } from '../../utils/storeAslMarkingSupport';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
} from '../../../platform/utils/companyAvatarUtils';
import { formatUzPhone } from '../../../../utils/phoneUz';
import { Spinner } from '../../../../components/ui';

export default function StoresTable({
  t,
  isPending,
  rows,
  page,
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
  const colSpan = showCompany ? 11 : 10;
  const regionCodes = rows.map((r) => r.regionCode).filter(Boolean);
  const { regionName, districtName, empty } = useGeoNameLookup(regionCodes);

  const renderGeo = (code, lookupFn) => {
    if (!code) return <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>;
    const name = lookupFn(code);
    if (!name || name === empty || name === 'Yo‘q' || name === "Yo'q" || name === 'Нет') {
      return <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>;
    }
    return name;
  };

  return (
    <div className="admin-table-shell">
      <div className="overflow-x-auto">
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
              <th className="px-4 py-3 font-medium">{t('geo.region')}</th>
              <th className="px-4 py-3 font-medium">{t('geo.district')}</th>
              <th className="px-4 py-3 font-medium">
                {showCompany ? t('platform.colBranchType', { defaultValue: 'Filial turi' }) : t('stores.colBusinessType')}
              </th>
              <th className="px-4 py-3 font-medium">{t('stores.colAddress')}</th>
              <th className="px-4 py-3 font-medium">{t('stores.colPhone')}</th>
              <th className="px-4 py-3 font-medium">{t('stores.colActive')}</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isPending ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center text-slate-500">
                  <Spinner size="md" text={t('common.loading')} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  {t('stores.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const branchMeta = getCompanyBranchMeta(row.businessType, t);
                const TypeIcon = branchMeta.icon;
                const badgeClass = getBusinessTypeBadgeClass();
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectStore?.(row)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                    
                    {/* Filial nomi + Avatar badge */}
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                          {getCompanyInitials(row.name)}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs" title={row.name}>
                          {row.name}
                        </span>
                      </div>
                    </td>

                    {/* Kompaniya */}
                    {showCompany && (
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs" title={row.companyName || ''}>
                        {row.companyName ? (
                          row.companyName
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>
                        )}
                      </td>
                    )}

                    {/* Viloyat */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {renderGeo(row.regionCode, regionName)}
                    </td>

                    {/* Tuman / Shahar */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {renderGeo(row.districtCode, districtName)}
                    </td>

                    {/* Filial / Biznes turi */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeClass}`}>
                        <TypeIcon size={12} className="shrink-0 text-slate-500 dark:text-slate-400" />
                        <span>
                          {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, {
                            defaultValue: row.businessType || 'Universal',
                          })}
                        </span>
                      </span>
                    </td>

                    {/* Manzil */}
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600 dark:text-slate-400" title={row.address || ''}>
                      {row.address || <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>}
                    </td>

                    {/* Telefon */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                      {row.phone ? (
                        formatUzPhone(row.phone)
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-sans font-medium">—</span>
                      )}
                    </td>

                    {/* Faol / Nofaol status badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          row.active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {row.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
                      </span>
                    </td>

                    {/* Harakatlar (Actions) */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <TableRowActionsMenu
                        open={menuId === row.id}
                        onOpenChange={(next) => onMenuOpenChange(next ? row.id : null)}
                        actions={[
                          { label: t('common.view', { defaultValue: 'Ko‘rish' }), onClick: () => onSelectStore?.(row) },
                          { label: t('common.edit'), onClick: () => onEdit(row) },
                          ...(storeIsPharmacy(row.businessType) && onPharmacyIntegration
                            ? [{
                              label: t('stores.pharmacyIntegration.menu'),
                              onClick: () => onPharmacyIntegration(row),
                            }]
                            : []),
                          {
                            label: row.active ? t('stores.deactivate') : t('stores.activate'),
                            onClick: () => onToggleActive(row.id),
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
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
