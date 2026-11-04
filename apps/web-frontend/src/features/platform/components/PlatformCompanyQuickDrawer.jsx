import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Pencil, Power, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
  getCompanyPalette,
} from '../utils/companyAvatarUtils';
import { useGeoNameLookup } from '../../shared/geo/useGeoNameLookup';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';
import PlatformCompanyQuickDrawerDetails from './PlatformCompanyQuickDrawerDetails';

export default function PlatformCompanyQuickDrawer({
  open = false,
  company = null,
  onClose,
  onEdit,
  onToggleActive,
  t,
  regionName: propRegionName,
  districtName: propDistrictName,
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const regionCodes = company?.regionCode ? [company.regionCode] : [];
  const { regionName: lookupRegion, districtName: lookupDistrict } = useGeoNameLookup(regionCodes);
  const regionName = propRegionName || lookupRegion;
  const districtName = propDistrictName || lookupDistrict;

  const { data: assignedData } = useQuery({
    queryKey: ['company-business-types', company?.id],
    queryFn: () => companyBusinessTypeApi.getForCompany(company.id).then((r) => r.data),
    enabled: Boolean(open && company?.id),
    staleTime: 60_000,
  });

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

  const region = regionName ? regionName(company.regionCode) : '';
  const district = districtName ? districtName(company.districtCode) : '';
  const regionLabel = [district, region].filter(Boolean).join(', ') || company.regionCode || '—';

  const drawerContent = (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-in-right">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('platform.quickView', { defaultValue: 'Tezkor ko‘rish' })}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 border shadow-xs ${palette}`}
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                    {company.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${company.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                    {company.active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                {company.legalName ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{company.legalName}</p>
                ) : null}
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">ID: #{company.id}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { onClose?.(); onEdit?.(company); }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
              >
                <Pencil size={14} />
                <span>{t('common.edit')}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleActive?.(company)}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  company.active
                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                <Power size={14} />
                <span>{company.active ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('platform.activate', { defaultValue: 'Faollashtirish' })}</span>
              </button>
            </div>

            <PlatformCompanyQuickDrawerDetails
              company={company}
              copied={copied}
              onCopyCode={handleCopyCode}
              regionLabel={regionLabel}
              branchMeta={branchMeta}
              badgeClass={badgeClass}
              assignedTypes={assignedData?.businessTypes || []}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : drawerContent;
}
