import React from 'react';
import { Eye, MapPin, Pencil, Phone, Power, Trash2 } from 'lucide-react';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
} from '../../../platform/utils/companyAvatarUtils';
import { formatUzPhone } from '../../../../utils/phoneUz';
import { storeIsPharmacy } from '../../utils/storeAslMarkingSupport';

export default function PlatformStoreMobileCard({
  row,
  districtName,
  regionName,
  onSelectStore,
  onEdit,
  onDelete,
  onToggleActive,
  onPharmacyIntegration,
  t,
}) {
  const initials = getCompanyInitials(row.name);
  const badgeClass = getBusinessTypeBadgeClass();
  const branchMeta = getCompanyBranchMeta(row.businessType, t);
  const BranchIcon = branchMeta.icon;

  const district = districtName ? districtName(row.districtCode) : '';
  const region = regionName ? regionName(row.regionCode) : '';
  const isGeoEmpty = (val) => !val || val === 'Yo‘q' || val === "Yo'q" || val === 'Нет';
  const validRegion = !isGeoEmpty(region) ? region : '';
  const validDistrict = !isGeoEmpty(district) ? district : '';
  const locationLabel = [validRegion, validDistrict].filter(Boolean).join(', ');

  const formattedPhone = row.phone ? formatUzPhone(row.phone) : null;

  return (
    <div
      onClick={() => onSelectStore?.(row)}
      className="ui-card-padded space-y-3 cursor-pointer hover:border-primary-300 transition"
    >
      {/* Header: Avatar + Branch Name + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-control bg-primary-50 text-primary-700 border border-primary-200 flex items-center justify-center font-bold text-sm shrink-0 ui-tabular"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-ink truncate text-sm">
              {row.name}
            </h3>
            {row.companyName ? (
              <p className="text-xs text-ink-muted truncate">
                {row.companyName}
              </p>
            ) : null}
          </div>
        </div>

        <span className={`shrink-0 ${row.active ? 'ui-badge-success' : 'ui-badge-neutral'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.active ? 'bg-success' : 'bg-ink-disabled'}`} />
          {row.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
        </span>
      </div>

      {/* Meta: Business Type + ID */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs">
        <span className="ui-tabular text-ink-disabled font-semibold">
          #{row.id}
        </span>

        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${badgeClass}`}>
          <BranchIcon size={12} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
          <span>
            {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, {
              defaultValue: row.businessType || 'Universal',
            })}
          </span>
        </span>

        {storeIsPharmacy(row.businessType) && onPharmacyIntegration ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPharmacyIntegration(row);
            }}
            className="ui-badge-primary cursor-pointer hover:bg-primary-100"
          >
            {t('stores.pharmacyIntegration.menu', { defaultValue: 'Dorixona' })}
          </button>
        ) : null}
      </div>

      {/* Location & Contact info */}
      <div className="space-y-1 text-xs text-ink-muted pt-1">
        {locationLabel ? (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={13} strokeWidth={1.75} className="shrink-0 text-ink-disabled" />
            <span className="truncate">{locationLabel}</span>
          </div>
        ) : null}

        {row.address ? (
          <div className="text-ink-muted truncate pl-4">
            {row.address}
          </div>
        ) : null}

        {formattedPhone ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Phone size={13} strokeWidth={1.75} className="shrink-0 text-ink-disabled" />
            <a href={`tel:${row.phone}`} className="ui-tabular hover:underline font-medium text-ink">
              {formattedPhone}
            </a>
          </div>
        ) : null}
      </div>

      {/* Actions footer */}
      <div
        className="grid grid-cols-4 gap-2 pt-2 border-t border-line"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelectStore?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-control bg-canvas hover:bg-primary-50 text-ink text-[11px] font-semibold gap-1 transition"
        >
          <Eye size={15} strokeWidth={1.75} />
          <span>{t('common.view', { defaultValue: 'Ko‘rish' })}</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(row)}
          className="flex flex-col items-center justify-center p-2 rounded-control bg-canvas hover:bg-primary-50 text-ink text-[11px] font-semibold gap-1 transition"
        >
          <Pencil size={15} strokeWidth={1.75} />
          <span>{t('common.edit', { defaultValue: 'Tahrir' })}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleActive(row.id)}
          className={`flex flex-col items-center justify-center p-2 rounded-control text-[11px] font-semibold gap-1 transition ${
            row.active
              ? 'bg-warning-soft text-warning-text'
              : 'bg-success-soft text-success-text'
          }`}
        >
          <Power size={15} strokeWidth={1.75} />
          <span>{row.active ? 'Faolsiz' : 'Faol'}</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(row)}
          className="flex flex-col items-center justify-center p-2 rounded-control bg-danger-soft text-danger-text text-[11px] font-semibold gap-1 transition"
        >
          <Trash2 size={15} strokeWidth={1.75} />
          <span>{t('common.delete', { defaultValue: 'O‘chirish' })}</span>
        </button>
      </div>
    </div>
  );
}
