import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Eye, MapPin, Pencil, Phone, Power, Trash2 } from 'lucide-react';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
  getCompanyPalette,
} from '../utils/companyAvatarUtils';
import { formatUzPhone } from '../../../utils/phoneUz';

export default function PlatformCompanyMobileCard({
  row,
  copiedId,
  onCopyLoginCode,
  districtName,
  regionName,
  onSelectCompany,
  onEdit,
  onDelete,
  onToggleActive,
  t,
}) {
  const initials = getCompanyInitials(row.name);
  const palette = getCompanyPalette(row.name, row.id);
  const badgeClass = getBusinessTypeBadgeClass(row.businessType);
  const branchMeta = getCompanyBranchMeta(row.businessType, t);
  const BranchIcon = branchMeta.icon;

  const district = districtName ? districtName(row.districtCode) : '';
  const region = regionName ? regionName(row.regionCode) : '';
  const locationLabel = [district, region].filter(Boolean).join(', ');

  const cleanTin = row.tin && /^\d+$/.test(String(row.tin).trim()) ? String(row.tin).trim() : null;
  const formattedPhone = row.phone ? formatUzPhone(row.phone) : null;

  return (
    <div
      onClick={() => onSelectCompany?.(row)}
      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition"
    >
      {/* Header: Avatar + Name + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-2xs ${palette}`}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">
              {row.name}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              ID: #{row.id}
            </p>
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
          {row.active ? t('common.active') : t('common.inactive')}
        </span>
      </div>

      {/* Meta Pills: Login Code + Business Type + Branches */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        {row.loginCode ? (
          <button
            type="button"
            onClick={(e) => onCopyLoginCode(e, row.loginCode, row.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300"
            title={t('common.copy')}
          >
            <span>{row.loginCode}</span>
            {copiedId === row.id ? (
              <Check size={12} className="text-emerald-500" />
            ) : (
              <Copy size={12} className="text-slate-400" />
            )}
          </button>
        ) : null}

        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold border ${badgeClass}`}>
          {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, { defaultValue: row.businessType })}
        </span>

        <Link
          to={`/platform/stores?companyId=${row.id}&focusCompany=${row.id}#company-${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${branchMeta.badgeClass}`}
        >
          <BranchIcon size={12} />
          <span>{row.storeCount ?? 0} ta filial</span>
        </Link>
      </div>

      {/* Location & Contact info */}
      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
        {locationLabel ? (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            <span className="truncate">{locationLabel}</span>
          </div>
        ) : null}

        {formattedPhone ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Phone size={13} className="shrink-0 text-slate-400" />
            <a href={`tel:${row.phone}`} className="hover:underline font-medium text-slate-700 dark:text-slate-300">
              {formattedPhone}
            </a>
          </div>
        ) : null}

        {cleanTin ? (
          <div className="font-mono text-[11px] text-slate-400">
            STIR: {cleanTin}
          </div>
        ) : null}
      </div>

      {/* Action buttons footer */}
      <div
        className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelectCompany?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold gap-1 transition"
        >
          <Eye size={15} />
          <span>Ko‘rish</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(row)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold gap-1 transition"
        >
          <Pencil size={15} />
          <span>Tahrir</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleActive?.(row)}
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
          <span>O‘chirish</span>
        </button>
      </div>
    </div>
  );
}
