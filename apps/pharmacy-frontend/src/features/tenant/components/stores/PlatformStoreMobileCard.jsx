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
      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition"
    >
      {/* Header: Avatar + Branch Name + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center font-bold text-sm shrink-0 font-mono shadow-2xs"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">
              {row.name}
            </h3>
            {row.companyName ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {row.companyName}
              </p>
            ) : null}
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            row.active
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {row.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
        </span>
      </div>

      {/* Meta: Business Type + ID */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold">
          #{row.id}
        </span>

        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${badgeClass}`}>
          <BranchIcon size={12} className="shrink-0 text-slate-500 dark:text-slate-400" />
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
            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
          >
            {t('stores.pharmacyIntegration.menu', { defaultValue: 'Dorixona' })}
          </button>
        ) : null}
      </div>

      {/* Location & Contact info */}
      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
        {locationLabel ? (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            <span className="truncate">{locationLabel}</span>
          </div>
        ) : null}

        {row.address ? (
          <div className="text-slate-600 dark:text-slate-400 truncate pl-4">
            {row.address}
          </div>
        ) : null}

        {formattedPhone ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Phone size={13} className="shrink-0 text-slate-400" />
            <a href={`tel:${row.phone}`} className="hover:underline font-mono font-medium text-slate-700 dark:text-slate-300">
              {formattedPhone}
            </a>
          </div>
        ) : null}
      </div>

      {/* Actions footer */}
      <div
        className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelectStore?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold gap-1 transition"
        >
          <Eye size={15} />
          <span>{t('common.view', { defaultValue: 'Ko‘rish' })}</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(row)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold gap-1 transition"
        >
          <Pencil size={15} />
          <span>{t('common.edit', { defaultValue: 'Tahrir' })}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleActive(row.id)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-semibold gap-1 transition ${
            row.active
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          }`}
        >
          <Power size={15} />
          <span>{row.active ? 'Faolsiz' : 'Faol'}</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(row)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-semibold gap-1 transition"
        >
          <Trash2 size={15} />
          <span>{t('common.delete', { defaultValue: 'O‘chirish' })}</span>
        </button>
      </div>
    </div>
  );
}
