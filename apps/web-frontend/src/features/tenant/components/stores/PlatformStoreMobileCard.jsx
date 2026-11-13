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
      className="p-4 rounded-aa-lg bg-aa-surface border border-aa-line shadow-none space-y-3 cursor-pointer hover:bg-aa-surface-hover transition"
    >
      {/* Header: Avatar + Branch Name + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line flex items-center justify-center font-bold text-sm shrink-0 font-mono"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-aa-ink truncate text-sm">
              {row.name}
            </h3>
            {row.companyName ? (
              <p className="text-xs text-aa-ink-muted truncate">
                {row.companyName}
              </p>
            ) : null}
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            row.active
              ? 'border-transparent bg-aa-success-soft text-aa-success bg-emerald-50'
              : 'border-aa-line bg-aa-surface text-aa-ink-muted'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.active ? 'bg-aa-success bg-emerald-500' : 'bg-aa-ink-subtle'}`} />
          {row.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
        </span>
      </div>

      {/* Meta: Business Type + ID */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-aa-line text-xs">
        <span className="font-mono text-aa-ink-subtle font-semibold">
          #{row.id}
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border border-aa-line bg-aa-surface-sunken text-aa-ink-muted">
          <BranchIcon size={12} className="shrink-0 text-aa-ink-muted" />
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
            className="px-2 py-0.5 rounded-full bg-aa-surface-sunken text-aa-ink font-medium border border-aa-line hover:bg-aa-surface-hover transition cursor-pointer"
          >
            {t('stores.pharmacyIntegration.menu', { defaultValue: 'Dorixona' })}
          </button>
        ) : null}
      </div>

      {/* Location & Contact info */}
      <div className="space-y-1 text-xs text-aa-ink-muted pt-1">
        {locationLabel ? (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={12} className="shrink-0 text-aa-ink-muted" />
            <span className="truncate">{locationLabel}</span>
          </div>
        ) : null}

        {row.address ? (
          <div className="text-aa-ink-muted truncate pl-4">
            {row.address}
          </div>
        ) : null}

        {formattedPhone ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Phone size={12} className="shrink-0 text-aa-ink-muted" />
            <a href={`tel:${row.phone}`} className="hover:underline font-mono font-medium text-aa-ink">
              {formattedPhone}
            </a>
          </div>
        ) : null}
      </div>

      {/* Actions footer */}
      <div
        className="grid grid-cols-4 gap-2 pt-2 border-t border-aa-line"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelectStore?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-aa-md bg-aa-surface-sunken hover:bg-aa-surface-hover text-aa-ink text-xs font-medium gap-1 transition cursor-pointer"
        >
          <Eye size={16} />
          <span>{t('common.view', { defaultValue: 'Ko‘rish' })}</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(row)}
          className="flex flex-col items-center justify-center p-2 rounded-aa-md bg-aa-surface-sunken hover:bg-aa-surface-hover text-aa-ink text-xs font-medium gap-1 transition cursor-pointer"
        >
          <Pencil size={16} />
          <span>{t('common.edit', { defaultValue: 'Tahrir' })}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleActive(row.id)}
          className={`flex flex-col items-center justify-center p-2 rounded-aa-md text-xs font-medium gap-1 transition cursor-pointer ${
            row.active
              ? 'bg-aa-warning-soft hover:bg-aa-warning-soft/80 text-aa-warning'
              : 'bg-aa-success-soft hover:bg-aa-success-soft/80 text-aa-success'
          }`}
        >
          <Power size={16} />
          <span>{row.active ? 'Faolsiz' : 'Faol'}</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(row)}
          className="flex flex-col items-center justify-center p-2 rounded-aa-md bg-aa-danger-soft hover:bg-aa-danger-soft/80 text-aa-danger text-xs font-medium gap-1 transition cursor-pointer"
        >
          <Trash2 size={16} />
          <span>{t('common.delete', { defaultValue: 'O‘chirish' })}</span>
        </button>
      </div>
    </div>
  );
}
