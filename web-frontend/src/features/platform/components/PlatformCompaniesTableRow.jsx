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
      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
    >
      <AdminTableNoIdCells page={effectivePage} pageSize={pageSize} index={index} id={row.id} />

      {/* Company Identity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border shadow-2xs ${palette}`}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
              {row.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate">
              {cleanTin ? <span className="font-mono">STIR: {cleanTin}</span> : null}
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
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {district || region}
            </div>
            {district && region && district !== region ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {region}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>

      {/* Login code */}
      <td className="px-4 py-3">
        {row.loginCode ? (
          <button
            type="button"
            onClick={(e) => onCopyLoginCode(e, row.loginCode, row.id)}
            className="group/btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-mono text-xs font-semibold text-slate-700 dark:text-slate-300"
            title={t('common.copy', { defaultValue: 'Nusxalash' })}
          >
            <span>{row.loginCode}</span>
            {copiedId === row.id ? (
              <Check size={12} className="text-emerald-500" />
            ) : (
              <Copy size={12} className="text-slate-400 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-200 transition-colors" />
            )}
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>

      {/* Branches */}
      <td className="px-4 py-3">
        <Link
          to={`/platform/stores?focusCompany=${row.id}#company-${row.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${branchMeta.badgeClass} transition-colors`}
          title={branchMeta.tooltip}
        >
          <BranchIcon size={12} />
          <span>{row.storeCount ?? 0}</span>
        </Link>
      </td>

      {/* Business type */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}>
          {t(`productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`, { defaultValue: row.businessType })}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            row.active
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {row.active ? t('common.active') : t('common.inactive')}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <TableRowActionsMenu
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
