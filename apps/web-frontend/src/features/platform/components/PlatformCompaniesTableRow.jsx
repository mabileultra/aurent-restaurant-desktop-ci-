import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Eye, Pencil, Power, Trash2 } from 'lucide-react';
import TableRowActionsMenu from '../../../components/shared/TableRowActionsMenu';
import { AdminTableNoIdCells } from '../../../components/shared/AdminTableNoIdColumns';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
  getCompanyPalette,
} from '../utils/companyAvatarUtils';
import { formatUzPhone } from '../../../utils/phoneUz';

export default function PlatformCompaniesTableRow({
  row,
  index,
  effectivePage,
  pageSize,
  copiedId,
  onCopyLoginCode,
  districtName,
  regionName,
  menuId,
  onMenuOpenChange,
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
  const hasLocation = Boolean(district || region);

  const cleanTin = row.tin && /^\d+$/.test(String(row.tin).trim()) ? String(row.tin).trim() : null;
  const formattedPhone = row.phone ? formatUzPhone(row.phone) : null;

  return (
    <tr
      onClick={() => onSelectCompany?.(row)}
      className="border-b border-aa-line hover:bg-aa-surface-hover cursor-pointer transition-colors group"
    >
      <AdminTableNoIdCells page={effectivePage} pageSize={pageSize} index={index} id={row.id} />

      {/* Company Identity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line flex items-center justify-center font-bold text-xs shrink-0 shadow-none font-mono"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-aa-ink group-hover:text-aa-brand transition-colors truncate">
              {row.name}
            </div>
            <div className="text-xs text-aa-ink-muted flex items-center gap-2 mt-0.5 truncate">
              {cleanTin ? <span className="font-mono aa-num">STIR: {cleanTin}</span> : null}
              {cleanTin && formattedPhone ? <span>·</span> : null}
              {formattedPhone ? <span>{formattedPhone}</span> : null}
              {!cleanTin && !formattedPhone && row.legalName ? (
                <span className="truncate">{row.legalName}</span>
              ) : null}
            </div>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="px-4 py-3">
        {hasLocation ? (
          <div>
            <div className="font-medium text-aa-ink truncate">
              {district || region}
            </div>
            {district && region && district !== region ? (
              <div className="text-xs text-aa-ink-muted truncate">
                {region}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-aa-ink-subtle font-medium">—</span>
        )}
      </td>

      {/* Login code */}
      <td className="px-4 py-3">
        {row.loginCode ? (
          <div className="inline-flex items-center gap-1.5 pl-2.5 pr-0.5 rounded-aa-sm bg-aa-surface-sunken border border-aa-line font-mono text-xs font-semibold text-aa-ink h-8">
            <span>{row.loginCode}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLoginCode(e, row.loginCode, row.id);
              }}
              className="aa-btn aa-btn--ghost aa-btn--icon aa-btn--sm rounded-aa-sm text-aa-ink-muted hover:text-aa-ink cursor-pointer"
              title={t('common.copy', { defaultValue: 'Nusxalash' })}
            >
              {copiedId === row.id ? (
                <Check size={16} className="text-aa-brand" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        ) : (
          <span className="text-aa-ink-subtle font-medium">—</span>
        )}
      </td>

      {/* Branches */}
      <td className="px-4 py-3">
        <Link
          to={`/platform/stores?focusCompany=${row.id}#company-${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-aa-line bg-aa-surface-sunken text-aa-ink-muted hover:bg-aa-surface-hover hover:text-aa-ink transition-colors"
          title={branchMeta.tooltip}
        >
          <BranchIcon size={12} />
          <span className="aa-num">{row.storeCount ?? 0}</span>
        </Link>
      </td>

      {/* Business type */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-aa-sm text-xs font-medium border border-aa-line bg-aa-surface-sunken text-aa-ink-muted bg-slate-100">
          {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, { defaultValue: row.businessType })}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            row.active
              ? 'border-aa-success/30 bg-aa-success-soft text-aa-success bg-emerald-50'
              : 'border-aa-line bg-aa-surface-sunken text-aa-ink-muted bg-slate-100'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.active ? 'bg-aa-success bg-emerald-500' : 'bg-aa-ink-subtle'}`} />
          {row.active ? t('common.active') : t('common.inactive')}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <TableRowActionsMenu
          variant="aa"
          open={menuId === row.id}
          onOpenChange={(next) => onMenuOpenChange(next ? row.id : null)}
          actions={[
            {
              label: t('platform.quickView', { defaultValue: 'Tezkor ko‘rish' }),
              icon: Eye,
              onClick: () => onSelectCompany?.(row),
            },
            {
              label: t('common.edit'),
              icon: Pencil,
              onClick: () => onEdit(row),
            },
            {
              label: row.active
                ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' })
                : t('platform.activate', { defaultValue: 'Faollashtirish' }),
              icon: Power,
              onClick: () => onToggleActive?.(row),
            },
            {
              label: t('common.delete'),
              icon: Trash2,
              danger: true,
              onClick: () => onDelete(row),
            },
          ]}
        />
      </td>
    </tr>
  );
}
