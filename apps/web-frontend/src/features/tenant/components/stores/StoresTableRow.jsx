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
      className="h-[52px] border-b border-aa-line hover:bg-aa-surface-hover transition-colors cursor-pointer group"
    >
      <AdminTableNoIdCells page={effectivePage} pageSize={pageSize} index={index} id={row.id} />

      {/* Filial nomi + Avatar badge */}
      <td className="px-4 py-3 font-medium text-aa-ink">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line flex items-center justify-center shrink-0 text-xs font-bold font-mono">
            {getCompanyInitials(row.name)}
          </div>
          <span className="font-semibold text-aa-ink truncate max-w-xs group-hover:text-aa-brand transition-colors" title={row.name}>
            {row.name}
          </span>
        </div>
      </td>

      {/* Kompaniya */}
      {showCompany && (
        <td className="px-4 py-3 text-aa-ink-muted font-medium truncate max-w-xs" title={row.companyName || ''}>
          {row.companyName ? (
            row.companyName
          ) : (
            <span className="text-aa-ink-subtle font-medium">—</span>
          )}
        </td>
      )}

      {/* Hudud (Viloyat va Tuman birlashtirilgan) */}
      <td className="px-4 py-3">
        {hasLocation ? (
          <div>
            <div className="font-medium text-aa-ink truncate">
              {validDistrict || validRegion}
            </div>
            {validDistrict && validRegion && validDistrict !== validRegion ? (
              <div className="text-xs text-aa-ink-muted truncate">
                {validRegion}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-aa-ink-subtle font-medium">—</span>
        )}
      </td>

      {/* Filial / Biznes turi */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-aa-line bg-aa-surface-sunken text-aa-ink-muted">
          <TypeIcon size={12} className="shrink-0 text-aa-ink-muted" />
          <span>
            {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, {
              defaultValue: row.businessType || 'Universal',
            })}
          </span>
        </span>
      </td>

      {/* Manzil */}
      <td className="max-w-xs truncate px-4 py-3 text-aa-ink-muted" title={row.address || ''}>
        {row.address || <span className="text-aa-ink-subtle font-medium">—</span>}
      </td>

      {/* Telefon */}
      <td className="px-4 py-3 text-aa-ink-muted font-mono text-xs whitespace-nowrap">
        {row.phone ? (
          formatUzPhone(row.phone)
        ) : (
          <span className="text-aa-ink-subtle font-sans font-medium">—</span>
        )}
      </td>

      {/* Holat (Faol / Nofaol) */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            row.active
              ? 'border-transparent bg-aa-success-soft text-aa-success bg-emerald-50'
              : 'border-aa-line bg-aa-surface text-aa-ink-muted'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-aa-success bg-emerald-500' : 'bg-aa-ink-subtle'}`} />
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
