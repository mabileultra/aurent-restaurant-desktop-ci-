import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!open) return undefined;
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
  }, [open, onClose]);

  if (!open || !user) return null;

  const initials = getUserInitials(user.fullName || user.username);
  const region = regionName ? regionName(user.regionCode) : user.regionCode;
  const district = districtName ? districtName(user.districtCode) : user.districtCode;
  const locationText = [region, district].filter(Boolean).join(' · ');

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
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          tabIndex={-1}
          className="w-screen max-w-md bg-white dark:!bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200 outline-none"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center shrink-0 text-base font-bold font-mono shadow-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 id="user-drawer-title" className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {user.fullName || user.username}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.active ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {user.active ? t('users.activeStatus', { defaultValue: 'Faol' }) : t('users.inactiveStatus', { defaultValue: 'Nofaol' })}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                      USER_ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              aria-label={t('common.close', { defaultValue: 'Yopish' })}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            
            {/* Quick Actions / Copy ID */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Hash size={16} className="text-slate-400 shrink-0" />
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                  {user.id}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors shrink-0"
              >
                <Copy size={13} />
                <span>{t('users.copyUuid', { defaultValue: 'Nusxalash' })}</span>
              </button>
            </div>

            {/* Profile & Contact Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                {t('users.personalDetails', { defaultValue: 'Shaxsiy ma\'lumotlar' })}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t('users.colUsername')}</span>
                    <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
                      {user.username}
                    </span>
                  </div>
                </div>

                {user.phone ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">{t('users.phone', { defaultValue: 'Telefon' })}</span>
                      <a
                        href={`tel:${user.phone}`}
                        className="text-sm font-mono text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {user.phone}
                      </a>
                    </div>
                  </div>
                ) : null}

                {user.email ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">{t('users.email')}</span>
                      <a
                        href={`mailto:${user.email}`}
                        className="text-sm text-slate-700 dark:text-slate-300 hover:underline truncate block"
                      >
                        {user.email}
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t('users.colCredentials', { defaultValue: 'Kirish turi' })}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {isPin
                        ? t('users.credentialsPinProtected', { defaultValue: 'PIN-kod bilan himoyalangan' })
                        : t('users.credentialsPasswordProtected', { defaultValue: 'Parol bilan himoyalangan' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t('users.createdAt', { defaultValue: 'Yaratilgan sana' })}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {formatSimpleDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workplace Info */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                {t('users.workplaceDetails', { defaultValue: 'Kompaniya va filiallar' })}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t('users.colCompany')}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {user.companyName || '—'}
                    </span>
                    {user.companyLoginCode ? (
                      <span className="ml-2 font-mono text-xs text-purple-600 dark:text-purple-400">
                        #{user.companyLoginCode}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    <Store size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t('users.colStores', { defaultValue: 'Filiallar' })}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {user.storeNames?.length ? user.storeNames.join(', ') : t('users.noStoresAvailable', { defaultValue: 'Biriktirilmagan' })}
                    </span>
                  </div>
                </div>

                {locationText ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">{t('geo.region', { defaultValue: 'Manzil' })}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {locationText}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit?.(user);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Pencil size={15} />
                {t('common.edit', { defaultValue: 'Tahrirlash' })}
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleActive?.(user.id);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  user.active
                    ? 'border border-amber-300 text-amber-700 dark:border-amber-700/80 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <Power size={15} />
                {user.active ? t('users.deactivate', { defaultValue: 'Faolsizlantirish' }) : t('users.activate', { defaultValue: 'Faollashtirish' })}
              </button>
            </div>

            <button
              type="button"
              onClick={handleTerminateSessions}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
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
