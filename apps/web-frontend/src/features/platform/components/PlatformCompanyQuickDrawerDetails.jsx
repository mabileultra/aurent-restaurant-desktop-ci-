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
    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
      {/* Kirish kodi */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('platform.colLoginCode')}
          </div>
          <div className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {company.loginCode || '—'}
          </div>
        </div>
        {company.loginCode ? (
          <button
            type="button"
            onClick={onCopyCode}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            title={t('common.copy')}
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        ) : null}
      </div>

      {/* STIR & Telefon */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('platform.field_tin')}
          </div>
          <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            {cleanTin || '—'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('platform.field_phone')}
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
            {formattedPhone ? (
              <a href={`tel:${company.phone}`} className="hover:underline flex items-center gap-1">
                <Phone size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{formattedPhone}</span>
              </a>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      {/* Biznes turlari (All assigned types) */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t('platform.colBusinessType')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}>
            {t(`productTemplates.businessTypes.${company.businessType ?? 'UNIVERSAL'}`, { defaultValue: company.businessType })} (Asosiy)
          </span>
          {assignedTypes
            .filter((bt) => bt.code !== company.businessType)
            .map((bt) => (
              <span key={bt.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {bt.name || bt.code}
              </span>
            ))}
        </div>
      </div>

      {/* Manzil */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <MapPin size={13} className="text-slate-400" />
          <span>{t('platform.colLocation')}</span>
        </div>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
          {regionLabel || '—'}
        </div>
        {company.address ? (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {company.address}
          </div>
        ) : null}
      </div>

      {/* Filiallarga to'g'ridan-to'g'ri havola */}
      <Link
        to={`/platform/stores?companyId=${company.id}&focusCompany=${company.id}#company-${company.id}`}
        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
      >
        <div className="flex items-center gap-2">
          <BranchIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {branchMeta.label} ro‘yxatini ko‘rish ({company.storeCount ?? 0})
          </span>
        </div>
        <ExternalLink size={14} className="text-slate-400 group-hover:text-emerald-600 transition" />
      </Link>
    </div>
  );
}
