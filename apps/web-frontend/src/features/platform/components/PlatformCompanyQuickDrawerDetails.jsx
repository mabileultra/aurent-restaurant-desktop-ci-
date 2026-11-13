import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, MapPin, Phone } from 'lucide-react';
import { formatUzPhone } from '../../../utils/phoneUz';

export default function PlatformCompanyQuickDrawerDetails({
  company,
  copied,
  onCopyCode,
  regionLabel,
  branchMeta,
  badgeClass,
  assignedTypes = [],
  t,
}) {
  const BranchIcon = branchMeta.icon;
  const cleanTin = company.tin && /^\d+$/.test(String(company.tin).trim()) ? String(company.tin).trim() : null;
  const formattedPhone = company.phone ? formatUzPhone(company.phone) : null;

  return (
    <div className="space-y-4 pt-2 border-t border-aa-line">
      {/* Kirish kodi */}
      <div className="flex items-center justify-between p-3 rounded-aa-md bg-aa-surface-sunken border border-aa-line">
        <div>
          <div className="text-xs font-medium text-aa-ink-muted">
            {t('platform.colLoginCode')}
          </div>
          <div className="font-mono text-sm font-bold text-aa-ink mt-0.5">
            {company.loginCode || '—'}
          </div>
        </div>
        {company.loginCode ? (
          <button
            type="button"
            onClick={onCopyCode}
            className="aa-size-icon-sm rounded-aa-md hover:bg-aa-surface-hover text-aa-ink-muted hover:text-aa-ink transition flex items-center justify-center cursor-pointer"
            title={t('common.copy')}
          >
            {copied ? <Check size={16} className="text-aa-success" /> : <Copy size={16} />}
          </button>
        ) : null}
      </div>

      {/* STIR & Telefon */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-aa-md bg-aa-surface-sunken border border-aa-line">
          <div className="text-xs font-medium text-aa-ink-muted">
            {t('platform.field_tin')}
          </div>
          <div className="font-mono text-sm font-semibold text-aa-ink mt-0.5">
            {cleanTin || '—'}
          </div>
        </div>

        <div className="p-3 rounded-aa-md bg-aa-surface-sunken border border-aa-line">
          <div className="text-xs font-medium text-aa-ink-muted">
            {t('platform.field_phone')}
          </div>
          <div className="text-sm font-semibold text-aa-ink mt-0.5 truncate">
            {formattedPhone ? (
              <a href={`tel:${company.phone}`} className="hover:underline flex items-center gap-1 text-aa-ink">
                <Phone size={12} className="text-aa-ink-muted shrink-0" />
                <span className="truncate">{formattedPhone}</span>
              </a>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      {/* Biznes turlari (All assigned types) */}
      <div className="p-3 rounded-aa-md bg-aa-surface-sunken border border-aa-line space-y-2">
        <div className="text-xs font-medium text-aa-ink-muted">
          {t('platform.colBusinessType')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-aa-line bg-aa-surface text-aa-ink">
            {t(`productTemplates.businessTypes.${company.businessType ?? 'UNIVERSAL'}`, { defaultValue: company.businessType })} (Asosiy)
          </span>
          {assignedTypes
            .filter((bt) => bt.code !== company.businessType)
            .map((bt) => (
              <span key={bt.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-aa-surface text-aa-ink-muted border border-aa-line">
                {bt.name || bt.code}
              </span>
            ))}
        </div>
      </div>

      {/* Manzil */}
      <div className="p-3 rounded-aa-md bg-aa-surface-sunken border border-aa-line">
        <div className="text-xs font-medium text-aa-ink-muted flex items-center gap-1.5">
          <MapPin size={13} className="text-aa-ink-muted" />
          <span>{t('platform.colLocation')}</span>
        </div>
        <div className="text-sm font-medium text-aa-ink mt-1">
          {regionLabel || '—'}
        </div>
        {company.address ? (
          <div className="text-xs text-aa-ink-muted mt-1">
            {company.address}
          </div>
        ) : null}
      </div>

      {/* Filiallarga to'g'ridan-to'g'ri havola */}
      <Link
        to={`/platform/stores?companyId=${company.id}&focusCompany=${company.id}#company-${company.id}`}
        className="flex items-center justify-between p-3 rounded-aa-md border border-aa-line hover:border-aa-brand/40 hover:bg-aa-surface-hover transition group bg-aa-surface"
      >
        <div className="flex items-center gap-2">
          <BranchIcon size={16} className="text-aa-brand" />
          <span className="text-xs font-semibold text-aa-ink">
            {branchMeta.label} ro‘yxatini ko‘rish ({company.storeCount ?? 0})
          </span>
        </div>
        <ExternalLink size={14} className="text-aa-ink-muted group-hover:text-aa-brand transition" />
      </Link>
    </div>
  );
}
