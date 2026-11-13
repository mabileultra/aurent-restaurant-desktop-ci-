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
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-aa-scrim transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
        <div className="w-screen max-w-md bg-aa-surface shadow-aa-modal flex flex-col border-l border-aa-line animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-aa-line flex items-center justify-between gap-4 bg-aa-surface-sunken">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-aa-brand shrink-0" />
              <h2 className="text-base font-bold text-aa-ink">
                {t('platform.quickView', { defaultValue: 'Tezkor ko‘rish' })}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="aa-size-icon-sm rounded-aa-md text-aa-ink-muted hover:text-aa-ink hover:bg-aa-surface-hover transition-colors cursor-pointer"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line flex items-center justify-center font-bold text-base font-mono shrink-0"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-aa-ink text-base truncate">
                    {company.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${company.active ? 'border-transparent bg-aa-success-soft text-aa-success' : 'border-aa-line bg-aa-surface text-aa-ink-muted'}`}>
                    {company.active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                {company.legalName ? (
                  <p className="text-xs text-aa-ink-muted mt-0.5 truncate">{company.legalName}</p>
                ) : null}
                <p className="text-xs text-aa-ink-muted font-mono mt-1">ID: #{company.id}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { onClose?.(); onEdit?.(company); }}
                className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Pencil size={14} />
                <span>{t('common.edit')}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleActive?.(company)}
                className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Power size={14} className={company.active ? 'text-aa-warning' : 'text-aa-success'} />
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
