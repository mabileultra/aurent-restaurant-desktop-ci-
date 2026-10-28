import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Hash,
  MapPin,
  Pencil,
  Phone,
  Power,
  Store,
  X,
} from 'lucide-react';
import {
  getBusinessTypeBadgeClass,
  getCompanyBranchMeta,
  getCompanyInitials,
} from '../../../platform/utils/companyAvatarUtils';
import { formatUzPhone } from '../../../../utils/phoneUz';
import { storeIsPharmacy } from '../../utils/storeAslMarkingSupport';

export default function PlatformStoreQuickDrawer({
  open = false,
  store = null,
  onClose,
  onEdit,
  onToggleActive,
  onPharmacyIntegration,
  t,
  regionName,
  districtName,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !store) return null;

  const initials = getCompanyInitials(store.name);
  const badgeClass = getBusinessTypeBadgeClass();
  const branchMeta = getCompanyBranchMeta(store.businessType, t);
  const BranchIcon = branchMeta.icon;

  const region = regionName ? regionName(store.regionCode) : store.regionCode;
  const district = districtName ? districtName(store.districtCode) : store.districtCode;
  const isGeoEmpty = (val) => !val || val === 'Yo‘q' || val === "Yo'q" || val === 'Нет';

  const drawerContent = (
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:!bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 text-base font-bold font-mono shadow-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {store.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      store.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {store.active ? t('common.active', { defaultValue: 'Faol' }) : t('common.inactive', { defaultValue: 'Nofaol' })}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${badgeClass}`}>
                    <BranchIcon size={12} className="shrink-0 text-slate-500" />
                    <span>{t(`productTemplates.businessTypes.${store.businessType ?? 'UNIVERSAL'}`, { defaultValue: store.businessType || 'Universal' })}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Asosiy ma'lumotlar */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('platform.drawerGeneralInfo', { defaultValue: 'Umumiy ma’lumotlar' })}
              </h3>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                
                {/* Kompaniya */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Building2 size={16} />
                    <span>{t('stores.colCompany', { defaultValue: 'Kompaniya' })}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {store.companyName || '—'}
                  </span>
                </div>

                {/* Filial ID */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Hash size={16} />
                    <span>ID</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    #{store.id}
                  </span>
                </div>

                {/* Telefon */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Phone size={16} />
                    <span>{t('stores.colPhone', { defaultValue: 'Telefon' })}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    {store.phone ? formatUzPhone(store.phone) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Joylashuv va manzil */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('platform.drawerLocationInfo', { defaultValue: 'Joylashuv va manzil' })}
              </h3>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/40 dark:bg-slate-800/40 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {!isGeoEmpty(region) || !isGeoEmpty(district) ? (
                        `${!isGeoEmpty(region) ? region : ''}${!isGeoEmpty(region) && !isGeoEmpty(district) ? ', ' : ''}${!isGeoEmpty(district) ? district : ''}`
                      ) : (
                        '—'
                      )}
                    </div>
                    {store.address && (
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {store.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleActive?.(store.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Power size={14} className={store.active ? 'text-amber-500' : 'text-emerald-500'} />
              <span>{store.active ? t('stores.deactivate', { defaultValue: 'To‘xtatish' }) : t('stores.activate', { defaultValue: 'Faollashtirish' })}</span>
            </button>

            <div className="flex items-center gap-2">
              {storeIsPharmacy(store.businessType) && onPharmacyIntegration && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPharmacyIntegration(store);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 transition-colors"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
              >
                <Pencil size={14} />
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
