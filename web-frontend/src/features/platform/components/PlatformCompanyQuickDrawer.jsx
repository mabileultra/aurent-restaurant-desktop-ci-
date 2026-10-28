import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Pencil,
  Phone,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
  getCompanyPalette,
} from '../utils/companyAvatarUtils';

export default function PlatformCompanyQuickDrawer({
  open = false,
  company = null,
  onClose,
  onEdit,
  t,
  regionName,
  districtName,
}) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !company) return null;

  const handleCopyCode = () => {
    if (!company.loginCode) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(company.loginCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('platform.loginCodeCopied', { defaultValue: 'Kirish kodi nusxalandi' }));
  };

  const initials = getCompanyInitials(company.name);
  const palette = getCompanyPalette(company.name, company.id);
  const badgeClass = getBusinessTypeBadgeClass(company.businessType);
  const branchMeta = getCompanyBranchMeta(company.businessType, t);
  const BranchIcon = branchMeta.icon;

  const region = regionName ? regionName(company.regionCode) : company.regionCode;
  const district = districtName ? districtName(company.districtCode) : company.districtCode;

  const drawerNode = (
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      {/* Full Backdrop covering top header and entire viewport */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <aside className="w-screen max-w-md bg-white dark:!bg-slate-900 border-l border-slate-200 dark:!border-slate-800 shadow-2xl flex flex-col h-full pointer-events-auto">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('platform.quickDrawerTitle', { defaultValue: 'Kompaniya profili' })}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Identity Card */}
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border shadow-sm shrink-0 ${palette}`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {company.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      company.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${company.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {company.active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                {company.legalName ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {company.legalName}
                  </p>
                ) : null}
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
                  ID: #{company.id}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onEdit?.(company);
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Pencil size={14} />
                <span>{t('common.edit')}</span>
              </button>

              <Link
                to={`/platform/stores?companyId=${company.id}`}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${branchMeta.badgeClass} transition-colors`}
                title={branchMeta.tooltip}
              >
                <BranchIcon size={14} />
                <span>{branchMeta.label} ({company.storeCount ?? 0})</span>
                <ExternalLink size={12} className="opacity-70" />
              </Link>
            </div>

            {/* Details Section */}
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
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors shadow-xs"
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
                    {company.tin || '—'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('platform.field_phone')}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                    {company.phone ? (
                      <a href={`tel:${company.phone}`} className="hover:underline flex items-center gap-1">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{company.phone}</span>
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>

              {/* Biznes turi */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('platform.colBusinessType')}
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}>
                      {t(`productTemplates.businessTypes.${company.businessType ?? 'UNIVERSAL'}`, { defaultValue: company.businessType })}
                    </span>
                  </div>
                </div>
                <Building2 size={20} className="text-slate-400" />
              </div>

              {/* Manzil */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <MapPin size={13} />
                  <span>{t('platform.colLocation', { defaultValue: 'Manzil' })}</span>
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {district || region ? `${district ? `${district}, ` : ''}${region || ''}` : '—'}
                </div>
                {company.address ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {company.address}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerNode, document.body);
  }
  return drawerNode;
}
