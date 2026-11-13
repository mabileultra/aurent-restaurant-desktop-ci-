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
      className="p-4 rounded-aa-lg bg-aa-surface border border-aa-line shadow-none space-y-3 cursor-pointer hover:border-aa-line-strong transition"
    >
      {/* Header: Avatar + Name + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line flex items-center justify-center font-bold text-sm shrink-0 font-mono shadow-none"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-aa-ink truncate text-sm">
              {row.name}
            </h3>
            <p className="text-xs text-aa-ink-muted font-mono aa-num">
              ID: #{row.id}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            row.active
              ? 'border-aa-success/30 bg-aa-success-soft text-aa-success'
              : 'border-aa-line bg-aa-surface-sunken text-aa-ink-muted'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.active ? 'bg-aa-success' : 'bg-aa-ink-subtle'}`} />
          {row.active ? t('common.active') : t('common.inactive')}
        </span>
      </div>

      {/* Meta Pills: Login Code + Business Type + Branches */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-aa-line text-xs">
        {row.loginCode ? (
          <button
            type="button"
            onClick={(e) => onCopyLoginCode(e, row.loginCode, row.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-aa-sm bg-aa-surface-sunken hover:bg-aa-surface-hover border border-aa-line font-mono font-bold text-aa-ink min-h-[32px]"
            title={t('common.copy')}
          >
            <span>{row.loginCode}</span>
            {copiedId === row.id ? (
              <Check size={12} className="text-aa-brand" />
            ) : (
              <Copy size={12} className="text-aa-ink-subtle" />
            )}
          </button>
        ) : null}

        <span className="inline-flex items-center px-2 py-0.5 rounded-aa-sm font-semibold border border-aa-line bg-aa-surface-sunken text-aa-ink-muted">
          {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, { defaultValue: row.businessType })}
        </span>

        <Link
          to={`/platform/stores?companyId=${row.id}&focusCompany=${row.id}#company-${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border border-aa-line bg-aa-surface-sunken text-aa-ink-muted hover:bg-aa-surface-hover hover:text-aa-ink transition-colors"
        >
          <BranchIcon size={12} />
          <span className="aa-num">{row.storeCount ?? 0} ta filial</span>
        </Link>
      </div>

      {/* Location & Contact info */}
      <div className="space-y-1 text-xs text-aa-ink-muted pt-1">
        {locationLabel ? (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={13} className="shrink-0 text-aa-ink-muted" />
            <span className="truncate">{locationLabel}</span>
          </div>
        ) : null}

        {formattedPhone ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Phone size={13} className="shrink-0 text-aa-ink-muted" />
            <a href={`tel:${row.phone}`} className="hover:underline font-medium text-aa-ink">
              {formattedPhone}
            </a>
          </div>
        ) : null}

        {cleanTin ? (
          <div className="font-mono text-[11px] text-aa-ink-muted aa-num">
            STIR: {cleanTin}
          </div>
        ) : null}
      </div>

      {/* Action buttons footer */}
      <div
        className="grid grid-cols-4 gap-2 pt-2 border-t border-aa-line"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelectCompany?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-aa-md bg-aa-surface-sunken hover:bg-aa-surface-hover border border-aa-line text-aa-ink text-[11px] font-semibold gap-1 transition min-h-[44px] cursor-pointer"
        >
          <Eye size={15} />
          <span>Ko‘rish</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-aa-md bg-aa-surface-sunken hover:bg-aa-surface-hover border border-aa-line text-aa-ink text-[11px] font-semibold gap-1 transition min-h-[44px] cursor-pointer"
        >
          <Pencil size={15} />
          <span>Tahrir</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleActive?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-aa-md bg-aa-surface-sunken hover:bg-aa-surface-hover border border-aa-line text-aa-ink text-[11px] font-semibold gap-1 transition min-h-[44px] cursor-pointer"
        >
          <Power size={15} className={row.active ? 'text-aa-warning' : 'text-aa-brand'} />
          <span>{row.active ? 'Faolsiz' : 'Faol'}</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(row)}
          className="flex flex-col items-center justify-center p-2 rounded-aa-md bg-aa-surface-sunken hover:bg-aa-danger-soft border border-aa-line text-aa-danger text-[11px] font-semibold gap-1 transition min-h-[44px] cursor-pointer"
        >
          <Trash2 size={15} />
          <span>O‘chirish</span>
        </button>
      </div>
    </div>
  );
}
