import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Calendar,
  Copy,
  Hash,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  Shield,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGeoNameLookup } from '../../../shared/geo/useGeoNameLookup';
import { USER_ROLE_BADGE } from '../../constants';
import { canDeleteUser } from '../../utils/userDeletePolicy';

function getUserInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatSimpleDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function PlatformUserQuickDrawer({
  open = false,
  user = null,
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

  const initials = getUserInitials(user.fullName || user.username);
  const regionRaw = user.regionCode ? (regionName ? regionName(user.regionCode) : lookupRegion(user.regionCode)) : '';
  const districtRaw = user.districtCode ? (districtName ? districtName(user.districtCode) : lookupDistrict(user.districtCode)) : '';
  const isPlaceholder = (val) => !val || val === 'Yo‘q' || val === 'Yo\'q' || val === 'Нет';
  const validRegion = isPlaceholder(regionRaw) ? '' : regionRaw;
  const validDistrict = isPlaceholder(districtRaw) ? '' : districtRaw;
  const locationText = [validRegion, validDistrict].filter(Boolean).join(' · ');

  const handleCopyId = () => {
    if (user.id) {
      navigator.clipboard.writeText(String(user.id));
      toast.success(t('users.uuidCopied', { defaultValue: 'ID nusxalandi' }));
    }
  };

  const handleTerminateSessions = () => {
    toast.success(t('users.sessionsTerminated', { defaultValue: 'Barcha faol sessiyalar tugatildi' }));
  };

  const isPin = user.role === 'CASHIER' || user.role === 'COOK' || user.role === 'WAITER';

  const drawerContent = (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          tabIndex={-1}
          className="w-screen max-w-md bg-surface shadow-modal border-l border-line flex flex-col outline-none"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-line flex items-start justify-between gap-4 bg-canvas">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 border border-primary-200 flex items-center justify-center shrink-0 text-base font-bold font-mono">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="user-drawer-title" className="text-base sm:text-lg font-bold text-ink break-words line-clamp-2 leading-snug">
                  {user.fullName || user.username}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`gap-1.5 ${
                      user.active ? 'ui-badge-success' : 'ui-badge-neutral'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.active ? 'bg-success' : 'bg-ink-disabled'
                      }`}
                    />
                    {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      USER_ROLE_BADGE[user.role] ?? 'ui-badge-neutral'
                    }`}
                  >
                    {t(`roles.${user.role}`, user.role)}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ui-icon-btn"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            
            {/* Quick Actions / Copy ID */}
            <div className="p-3 rounded-card bg-canvas border border-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Hash size={16} className="text-ink-muted shrink-0" />
                <span className="text-xs font-mono ui-tabular text-ink-muted truncate">
                  {user.id}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-input text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors shrink-0"
              >
                <Copy size={13} />
                <span>{t('users.copyUuid', { defaultValue: 'Nusxalash' })}</span>
              </button>
            </div>

            {/* Profile & Contact Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                {t('users.personalDetails', { defaultValue: 'Shaxsiy ma\'lumotlar' })}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted block">{t('users.colUsername')}</span>
                    <span className="text-sm font-mono font-medium text-ink">
                      {user.username}
                    </span>
                  </div>
                </div>

                {user.phone ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block">{t('users.phone', { defaultValue: 'Telefon' })}</span>
                      <a
                        href={`tel:${user.phone}`}
                        className="text-sm font-mono ui-tabular text-primary-600 hover:underline"
                      >
                        {user.phone}
                      </a>
                    </div>
                  </div>
                ) : null}

                {user.email ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block">{t('users.email')}</span>
                      <a
                        href={`mailto:${user.email}`}
                        className="text-sm text-ink hover:underline truncate block"
                      >
                        {user.email}
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted block">{t('users.colCredentials', { defaultValue: 'Kirish turi' })}</span>
                    <span className="text-sm text-ink">
                      {isPin
                        ? t('users.credentialsPinProtected', { defaultValue: 'PIN-kod bilan himoyalangan' })
                        : t('users.credentialsPasswordProtected', { defaultValue: 'Parol bilan himoyalangan' })}
                    </span>
                  </div>
                </div>

                {user.createdAt ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block">{t('users.createdAt', { defaultValue: 'Yaratilgan sana' })}</span>
                      <span className="text-sm text-ink ui-tabular">
                        {formatSimpleDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Workplace Info */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">
                {t('users.workplaceDetails', { defaultValue: 'Kompaniya va filiallar' })}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted block">{t('users.colCompany')}</span>
                    <span className="text-sm font-medium text-ink">
                      {user.companyName || '—'}
                    </span>
                    {user.companyLoginCode ? (
                      <span className="ml-2 font-mono text-xs ui-tabular text-primary-600">
                        #{user.companyLoginCode}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                    <Store size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted block">{t('users.colStores', { defaultValue: 'Filiallar' })}</span>
                    <span className="text-sm text-ink">
                      {user.storeNames?.length ? user.storeNames.join(', ') : t('users.noStoresAvailable', { defaultValue: 'Biriktirilmagan' })}
                    </span>
                  </div>
                </div>

                {locationText ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-input bg-canvas border border-line text-ink-muted shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block">{t('geo.region', { defaultValue: 'Manzil' })}</span>
                      <span className="text-sm text-ink">
                        {locationText}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-line bg-canvas flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit?.(user);
                }}
                className="ui-btn-secondary"
              >
                <Pencil size={15} />
                {t('common.edit', { defaultValue: 'Tahrirlash' })}
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleActive?.(user.id);
                }}
                className={
                  user.active
                    ? 'ui-btn-secondary border-warning/40 text-warning-text hover:bg-warning-soft'
                    : 'ui-btn-primary'
                }
              >
                <Power size={15} />
                {user.active ? t('users.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('users.activate', { defaultValue: 'Faollashtirish' })}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit?.(user);
              }}
              className="ui-btn-secondary h-9 text-xs"
            >
              <KeyRound size={14} />
              {t('users.resetPasswordOrPin', { defaultValue: 'Parol / PIN tiklash' })}
            </button>

            <button
              type="button"
              onClick={handleTerminateSessions}
              className="ui-btn-ghost h-9 text-xs"
            >
              <LogOut size={14} />
              {t('users.actionsTerminateSessions', { defaultValue: 'Faol sessiyalarni tugatish' })}
            </button>

            {canDeleteUser(actorRole, user.role) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete?.(user);
                }}
                className="ui-btn-danger h-9 text-xs"
              >
                <Trash2 size={14} />
                {t('common.delete', { defaultValue: 'O‘chirish' })}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(drawerContent, document.body);
  }
  return drawerContent;
}
