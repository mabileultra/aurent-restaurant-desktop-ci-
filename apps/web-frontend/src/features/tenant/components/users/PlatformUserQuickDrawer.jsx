import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { USER_ROLE_BADGE } from '../../constants';
import { sanitizeUserDisplayName } from '../../utils/userFormValidationUtils';
import PlatformUserQuickDrawerDetails from './PlatformUserQuickDrawerDetails';
import PlatformUserQuickDrawerActions from './PlatformUserQuickDrawerActions';

function getUserInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * PlatformUserQuickDrawer
 * Side drawer for inspecting user information and performing actions.
 */
export default function PlatformUserQuickDrawer({
  open = false,
  user = null,
  currentUserId,
  currentUsername,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
  actorRole,
  t,
  regionName,
  districtName,
}) {
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  const regionCodes = useMemo(() => (user?.regionCode ? [user.regionCode] : []), [user?.regionCode]);
  const { regionName: lookupRegion, districtName: lookupDistrict } = useGeoNameLookup(regionCodes);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.getElementById(`user-row-${user?.id}`)
        || document.getElementById(`user-card-${user?.id}`)
        || document.activeElement;
      const timer = setTimeout(() => {
        const closeBtn = drawerRef.current?.querySelector('button');
        closeBtn?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose?.();
        } else if (e.key === 'Tab') {
          if (!drawerRef.current) return;
          const focusables = drawerRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else if (triggerRef.current) {
      triggerRef.current.focus?.();
      triggerRef.current = null;
    }
    return undefined;
  }, [open, onClose, user?.id]);

  if (!open || !user) return null;

  const displayName = sanitizeUserDisplayName(user.fullName, user.username);
  const initials = getUserInitials(displayName);

  const regionRaw = user.regionCode ? (regionName ? regionName(user.regionCode) : lookupRegion(user.regionCode)) : '';
  const districtRaw = user.districtCode ? (districtName ? districtName(user.districtCode) : lookupDistrict(user.districtCode)) : '';
  const isPlaceholder = (val) => !val || val === 'Yo‘q' || val === 'Yo\'q' || val === 'Нет';
  const validRegion = isPlaceholder(regionRaw) ? '' : regionRaw;
  const validDistrict = isPlaceholder(districtRaw) ? '' : districtRaw;
  const locationText = [validRegion, validDistrict].filter(Boolean).join(' · ');

  const isSelf =
    (currentUserId && String(user.id) === String(currentUserId)) ||
    (currentUsername && user.username && user.username.toLowerCase() === currentUsername.toLowerCase());

  const drawerContent = (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          tabIndex={-1}
          className="w-screen max-w-md bg-aa-surface shadow-2xl border-l border-aa-line flex flex-col animate-in slide-in-from-right duration-200 outline-none"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-aa-line flex items-start justify-between gap-4 bg-aa-surface-sunken">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-aa-md bg-aa-surface-sunken text-aa-ink border border-aa-line flex items-center justify-center shrink-0 text-base font-bold font-mono">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="user-drawer-title" className="text-base sm:text-lg font-bold text-aa-ink break-words line-clamp-2 leading-snug">
                  {displayName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      user.active
                        ? 'border-aa-line bg-aa-success-soft text-aa-success'
                        : 'border-aa-line bg-aa-surface-sunken text-aa-ink-muted'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.active ? 'bg-aa-success' : 'bg-aa-ink-subtle'
                      }`}
                    />
                    {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
                  </span>
                  <span className="inline-flex items-center rounded-aa-sm px-2 py-0.5 text-xs font-semibold bg-aa-surface-sunken text-aa-ink-muted border border-aa-line">
                    {t(`roles.${user.role}`, user.role)}
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

          <PlatformUserQuickDrawerDetails user={user} t={t} locationText={locationText} />

          <PlatformUserQuickDrawerActions
            user={user}
            actorRole={actorRole}
            isSelf={isSelf}
            t={t}
            onClose={onClose}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerContent, document.body);
  }
  return drawerContent;
}
