import React from 'react';
import TableRowActionsMenu from '../../../../components/shared/TableRowActionsMenu';
import { AdminTableNoIdCells } from '../../../../components/shared/AdminTableNoIdColumns';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
} from '../../../platform/utils/companyAvatarUtils';
import { formatUzPhone } from '../../../../utils/phoneUz';
import { storeIsPharmacy } from '../../utils/storeAslMarkingSupport';

export default function StoresTableRow({
  row,
  index,
  effectivePage,
  pageSize,
  showCompany,
  regionName,
  districtName,
  empty,
  menuId,
  onMenuOpenChange,
  onSelectStore,
  onEdit,
  onToggleActive,
  onDelete,
  onPharmacyIntegration,
  t,
}) {
  const branchMeta = getCompanyBranchMeta(row.businessType, t);
  const TypeIcon = branchMeta.icon;
  const badgeClass = getBusinessTypeBadgeClass();

  const district = districtName ? districtName(row.districtCode) : '';
  const region = regionName ? regionName(row.regionCode) : '';
  const isGeoEmpty = (val) => !val || val === empty || val === 'Yo‘q' || val === "Yo'q" || val === 'Нет';
  const validRegion = !isGeoEmpty(region) ? region : '';
  const validDistrict = !isGeoEmpty(district) ? district : '';
  const hasLocation = Boolean(validDistrict || validRegion);

  return (
    <tr
      onClick={() => onSelectStore?.(row)}
      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
    >
      <AdminTableNoIdCells page={effectivePage} pageSize={pageSize} index={index} id={row.id} />

      {/* Filial nomi + Avatar badge */}
      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
            {getCompanyInitials(row.name)}
          </div>
          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" title={row.name}>
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

      {/* Hudud (Viloyat va Tuman birlashtirilgan) */}
      <td className="px-4 py-3">
        {hasLocation ? (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {validDistrict || validRegion}
            </div>
            {validDistrict && validRegion && validDistrict !== validRegion ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {validRegion}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-600 font-medium">—</span>
        )}
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

      {/* Holat (Faol / Nofaol) */}
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
                label: t('stores.pharmacyIntegration.menu', { defaultValue: 'Dorixona integratsiyasi' }),
                onClick: () => onPharmacyIntegration(row),
              }]
              : []),
            {
              label: row.active ? t('stores.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('stores.activate', { defaultValue: 'Faollashtirish' }),
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
}
