import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Power, X } from 'lucide-react';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
} from '../../../platform/utils/companyAvatarUtils';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { storeIsPharmacy } from '../../utils/storeAslMarkingSupport';
import PlatformStoreQuickDrawerDetails from './PlatformStoreQuickDrawerDetails';

export default function PlatformStoreQuickDrawer({
  open = false,
  store = null,
  onClose,
  onEdit,
  onToggleActive,
  onPharmacyIntegration,
  t,
  regionName: propRegionName,
  districtName: propDistrictName,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const regionCodes = store?.regionCode ? [store.regionCode] : [];
  const { regionName: lookupRegion, districtName: lookupDistrict } = useGeoNameLookup(regionCodes);
  const regionName = propRegionName || lookupRegion;
  const districtName = propDistrictName || lookupDistrict;

  if (!open || !store) return null;

  const initials = getCompanyInitials(store.name);
  const badgeClass = getBusinessTypeBadgeClass();
  const branchMeta = getCompanyBranchMeta(store.businessType, t);
  const BranchIcon = branchMeta.icon;

  const region = regionName ? regionName(store.regionCode) : '';
  const district = districtName ? districtName(store.districtCode) : '';
  const isGeoEmpty = (val) => !val || val === 'Yo‘q' || val === "Yo'q" || val === 'Нет';

  const validRegion = !isGeoEmpty(region) ? region : '';
  const validDistrict = !isGeoEmpty(district) ? district : '';
  const regionLabel = [validRegion, validDistrict].filter(Boolean).join(', ') || '—';

  const drawerContent = (
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-aa-scrim transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-aa-surface shadow-aa-modal border-l border-aa-line flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-aa-line flex items-start justify-between gap-4 bg-aa-surface-sunken">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line flex items-center justify-center shrink-0 text-base font-bold font-mono">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-aa-ink truncate">
                  {store.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      store.active
                        ? 'border-transparent bg-aa-success-soft text-aa-success bg-emerald-50'
                        : 'border-aa-line bg-aa-surface text-aa-ink-muted'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-aa-success bg-emerald-500' : 'bg-aa-ink-subtle'}`} />
                    {store.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-aa-line bg-aa-surface text-aa-ink-muted">
                    <BranchIcon size={12} className="shrink-0 text-aa-ink-muted" />
                    <span>{t(`productTemplates.businessTypes.${store.businessType ?? 'UNIVERSAL'}`, { defaultValue: store.businessType || 'Universal' })}</span>
                  </span>
                </div>
              </div>
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

          <PlatformStoreQuickDrawerDetails
            store={store}
            regionLabel={regionLabel}
            t={t}
          />

          {/* Footer Actions */}
          <div className="p-4 border-t border-aa-line bg-aa-surface-sunken flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleActive?.(store);
              }}
              className="aa-btn aa-btn--secondary aa-size-md inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Power size={16} className={store.active ? 'text-aa-warning' : 'text-aa-success'} />
              <span>{store.active ? t('platform.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('platform.activate', { defaultValue: 'Faollashtirish' })}</span>
            </button>

            <div className="flex items-center gap-2">
              {storeIsPharmacy(store.businessType) && onPharmacyIntegration && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPharmacyIntegration(store);
                  }}
                  className="aa-btn aa-btn--secondary aa-size-md cursor-pointer"
                >
                  {t('stores.pharmacyIntegration.menu', { defaultValue: 'Dorixona' })}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit?.(store);
                }}
                className="aa-btn aa-btn--primary aa-size-md inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pencil size={16} />
                <span>{t('common.edit', { defaultValue: 'Tahrirlash' })}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
}
