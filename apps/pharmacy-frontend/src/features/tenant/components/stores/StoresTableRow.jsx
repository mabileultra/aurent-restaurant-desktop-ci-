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
      className="ui-tr cursor-pointer group"
    >
      <AdminTableNoIdCells page={effectivePage} pageSize={pageSize} index={index} id={row.id} />

      {/* Filial nomi + Avatar badge */}
      <td className="ui-td font-medium">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 flex items-center justify-center shrink-0 text-xs font-bold ui-tabular">
            {getCompanyInitials(row.name)}
          </div>
          <span className="font-semibold text-ink truncate max-w-xs group-hover:text-primary-700 transition-colors" title={row.name}>
            {row.name}
          </span>
        </div>
      </td>

      {/* Kompaniya */}
      {showCompany && (
        <td className="ui-td text-ink-muted font-medium truncate max-w-xs" title={row.companyName || ''}>
          {row.companyName ? (
            row.companyName
          ) : (
            <span className="text-ink-disabled font-medium">—</span>
          )}
        </td>
      )}

      {/* Hudud */}
      <td className="ui-td">
        {hasLocation ? (
          <div>
            <div className="font-medium text-ink truncate">
              {validDistrict || validRegion}
            </div>
            {validDistrict && validRegion && validDistrict !== validRegion ? (
              <div className="text-xs text-ink-muted truncate">
                {validRegion}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-ink-disabled font-medium">—</span>
        )}
      </td>

      {/* Filial / Biznes turi */}
      <td className="ui-td-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
          <TypeIcon size={12} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
          <span>
            {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, {
              defaultValue: row.businessType || 'Universal',
            })}
          </span>
        </span>
      </td>

      {/* Manzil */}
      <td className="ui-td max-w-xs truncate text-ink-muted" title={row.address || ''}>
        {row.address || <span className="text-ink-disabled font-medium">—</span>}
      </td>

      {/* Telefon */}
      <td className="ui-td-nowrap text-xs text-ink-muted">
        {row.phone ? (
          formatUzPhone(row.phone)
        ) : (
          <span className="text-ink-disabled font-medium">—</span>
        )}
      </td>

      {/* Holat */}
      <td className="ui-td-nowrap">
        <span className={row.active ? 'ui-badge-success' : 'ui-badge-neutral'}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-success' : 'bg-ink-disabled'}`} />
          {row.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
        </span>
      </td>

      {/* Actions */}
      <td className="ui-td" onClick={(e) => e.stopPropagation()}>
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
