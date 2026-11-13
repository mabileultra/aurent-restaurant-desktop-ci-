import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Badge from '../../../components/aa/Badge';
import Button from '../../../components/aa/Button';
import CompanyRowActionsMenu from './CompanyRowActionsMenu';
import { getCompanyInitials } from '../utils/companyAvatarUtils';
import { formatUzPhone } from '../../../utils/phoneUz';

/**
 * PlatformCompaniesTableRow — Jadvaldagi bitta kompaniya qatori.
 * aa dizayn tizimiga mos, qator balandligi kamida 52px.
 */
export default function PlatformCompaniesTableRow({
  row,
  index,
  effectivePage = 0,
  pageSize = 14,
  districtName,
  regionName,
  menuId,
  onMenuOpenChange,
  onSelectCompany,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const rowNumber = effectivePage * pageSize + index + 1;
  const initials = getCompanyInitials(row.name);
  const district = districtName ? districtName(row.districtCode) : '';
  const region = regionName ? regionName(row.regionCode) : '';

  const cleanTin = row.tin && /^\d+$/.test(String(row.tin).trim()) ? String(row.tin).trim() : null;
  const formattedPhone = row.phone ? formatUzPhone(row.phone) : null;

  const handleCopyLoginCode = (e) => {
    e.stopPropagation();
    if (!row.loginCode) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(row.loginCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Kirish kodi nusxalandi');
  };

  const businessTypeLabel = t(
    `productTemplates.businessTypes.${row.businessType ?? 'UNIVERSAL'}`,
    { defaultValue: row.businessType || 'Universal' }
  );

  return (
    <tr className="h-[52px]">
      {/* 1. № */}
      <td className="w-12 text-center text-aa-ink-muted tabular-nums text-xs">
        {rowNumber}
      </td>

      {/* 2. ID */}
      <td className="w-16 font-mono text-xs text-aa-ink-muted">
        {row.id}
      </td>

      {/* 3. Kompaniya */}
      <td>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-aa-full bg-aa-surface-sunken border border-aa-line text-aa-ink-muted text-xs font-semibold flex items-center justify-center shrink-0 select-none"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onSelectCompany?.(row)}
              className="text-left font-semibold text-sm leading-5 text-aa-ink hover:text-aa-brand transition-colors truncate max-w-[240px] block cursor-pointer"
            >
              {row.name}
            </button>
            <div className="text-[13px] text-aa-ink-muted flex items-center gap-1.5 mt-0.5 truncate">
              <span
                className="font-mono font-normal text-[12px]"
                style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 400 }}
              >
                STIR {cleanTin || '—'}
              </span>
              {formattedPhone ? (
                <>
                  <span>·</span>
                  <span>{formattedPhone}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </td>

      {/* 4. Manzil */}
      <td>
        <div>
          <div className="text-sm font-medium text-aa-ink truncate max-w-[180px]">
            {district || region || '—'}
          </div>
          {district && region && district !== region ? (
            <div className="text-[13px] text-aa-ink-muted truncate max-w-[180px]">
              {region}
            </div>
          ) : null}
        </div>
      </td>

      {/* 5. Kirish kodi */}
      <td>
        {row.loginCode ? (
          <div className="inline-flex items-center gap-1.5">
            <span
              className="font-mono font-normal text-[13px] text-aa-ink"
              style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 400 }}
            >
              {row.loginCode}
            </span>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon={copied ? <Check size={14} className="text-aa-success" /> : <Copy size={14} />}
              aria-label={`${row.name}: kirish kodini nusxalash`}
              onClick={handleCopyLoginCode}
              className="h-8 w-8 !p-0"
            />
          </div>
        ) : (
          <span className="text-aa-ink-muted">—</span>
        )}
      </td>

      {/* 6. Filiallar */}
      <td className="text-right tabular-nums text-sm font-medium text-aa-ink">
        {row.storeCount != null ? row.storeCount : '—'}
      </td>

      {/* 7. Faoliyat turi */}
      <td>
        <Badge tone="neutral">
          {businessTypeLabel}
        </Badge>
      </td>

      {/* 8. Holati */}
      <td>
        <Badge tone={row.active ? 'success' : 'neutral'} dot>
          {row.active ? 'Faol' : 'Nofaol'}
        </Badge>
      </td>

      {/* 9. Amallar */}
      <td className="text-right">
        <CompanyRowActionsMenu
          company={row}
          open={menuId === row.id}
          onOpenChange={(nextOpen) => onMenuOpenChange?.(nextOpen ? row.id : null)}
          onSelectCompany={onSelectCompany}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
