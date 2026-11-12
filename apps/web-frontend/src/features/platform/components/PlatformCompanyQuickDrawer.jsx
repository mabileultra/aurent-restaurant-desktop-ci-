import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Power, X } from 'lucide-react';
import Badge from '../../../components/aa/Badge';
import Button from '../../../components/aa/Button';
import PlatformCompanyQuickDrawerDetails from './PlatformCompanyQuickDrawerDetails';
import { getCompanyInitials } from '../utils/companyAvatarUtils';
import { useGeoNameLookup } from '../../shared/geo/useGeoNameLookup';
import { companyBusinessTypeApi } from '../../../api/companyBusinessType.api';

/**
 * PlatformCompanyQuickDrawer — Tezkor ko‘rish o‘ng paneli.
 * Eni: 440px (mobilda 100%), fon aa-surface, shadow-modal, aa-scrim ortida.
 */
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
  const drawerRef = useRef(null);
  const prevActiveElementRef = useRef(null);

  // Focus trap va Esc listener
  useEffect(() => {
    if (!open) return undefined;

    prevActiveElementRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      const closeBtn = drawerRef.current?.querySelector('button[aria-label="Yopish"]');
      closeBtn?.focus();
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (prevActiveElementRef.current?.focus) {
        prevActiveElementRef.current.focus();
      }
    };
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

  const initials = getCompanyInitials(company.name);
  const region = regionName ? regionName(company.regionCode) : '';
  const district = districtName ? districtName(company.districtCode) : '';
  const regionLabel = [district, region].filter(Boolean).join(', ') || company.regionCode || '—';

  const drawerContent = (
    <div
      className="fixed inset-0 z-50 bg-[var(--aa-scrim)] flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-drawer-title"
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="w-full sm:w-[440px] h-full bg-aa-surface shadow-modal border-l border-aa-line flex flex-col animate-slide-in-right overflow-hidden fixed top-0 right-0 bottom-0"
      >
        {/* Tepasi 64px: «Tezkor ko‘rish» va Yopish */}
        <div className="h-16 px-5 border-b border-aa-line flex items-center justify-between shrink-0">
          <h2 id="quick-drawer-title" className="text-[15px] leading-[22px] font-semibold text-aa-ink">
            Tezkor ko‘rish
          </h2>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={<X size={16} aria-hidden="true" />}
            aria-label="Yopish"
            onClick={onClose}
            className="h-8 w-8 !p-0"
          />
        </div>

        {/* Ichi: padding 20, bloklar orasi 20 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Kompaniya bosh qismi */}
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-aa-full bg-aa-surface-sunken border border-aa-line text-aa-ink-muted text-sm font-semibold flex items-center justify-center shrink-0 select-none"
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg leading-[26px] font-semibold text-aa-ink truncate">
                {company.name}
              </h3>
              <p className="text-[13px] text-aa-ink-muted truncate mt-0.5">
                {company.legalName || 'Yuridik nomi ko‘rsatilmagan'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="font-mono font-normal text-[13px] text-aa-ink-muted"
                  style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 400 }}
                >
                  ID #{company.id}
                </span>
                <Badge tone={company.active ? 'success' : 'neutral'} dot>
                  {company.active ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Teng enli ikkita secondary tugma: Tahrirlash va Faolsizlantirish/Faollashtirish */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              icon={<Pencil size={16} aria-hidden="true" />}
              onClick={() => onEdit?.(company)}
              className="w-full"
            >
              Tahrirlash
            </Button>
            <Button
              variant="secondary"
              icon={<Power size={16} aria-hidden="true" />}
              onClick={() => onToggleActive?.(company)}
              className="w-full"
            >
              {company.active ? 'Faolsizlantirish' : 'Faollashtirish'}
            </Button>
          </div>

          {/* Ma’lumotlar ro‘yxati (dl) va havola-qator */}
          <PlatformCompanyQuickDrawerDetails
            company={company}
            regionLabel={regionLabel}
            assignedTypes={assignedData?.businessTypes || []}
            t={t}
          />
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : drawerContent;
}
