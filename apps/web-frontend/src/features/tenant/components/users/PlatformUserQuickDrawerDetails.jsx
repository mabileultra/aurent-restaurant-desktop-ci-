import React from 'react';
import {
  Building2,
  Calendar,
  Copy,
  Hash,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Shield,
  Store,
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatSimpleDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return Number.isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return '—';
  }
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-aa-md bg-aa-surface-sunken text-aa-ink-muted border border-aa-line shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs text-aa-ink-muted block">{label}</span>
        {children}
      </div>
    </div>
  );
}

/**
 * PlatformUserQuickDrawerDetails
 * Displays profile, credentials, workplace and contact information.
 */
export default function PlatformUserQuickDrawerDetails({ user, t, locationText }) {
  const isPin = user.role === 'CASHIER' || user.role === 'COOK' || user.role === 'WAITER';
  const isPlatformStaff = user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN';

  const handleCopyId = () => {
    if (user.id) {
      navigator.clipboard.writeText(String(user.id));
      toast.success(t('users.uuidCopied', { defaultValue: 'ID nusxalandi' }));
    }
  };

  const companyDisplay = isPlatformStaff
    ? t('users.platformAdminScope', { defaultValue: 'Platforma' })
    : (user.companyName || t('users.orphanCompany', { defaultValue: 'Kompaniyasiz (o‘chirilgan)' }));

  const storesDisplay = isPlatformStaff
    ? t('users.platformScopeAll', { defaultValue: 'Barcha filiallar va tizim' })
    : (user.storeNames?.length ? user.storeNames.join(', ') : t('users.noStoresAvailable', { defaultValue: 'Biriktirilmagan' }));

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      {/* Quick Actions / Copy ID */}
      <div className="p-3 rounded-aa-lg bg-aa-surface-sunken border border-aa-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Hash size={16} className="text-aa-ink-muted shrink-0" />
          <span className="text-xs font-mono text-aa-ink-muted truncate">{user.id}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyId}
          className="aa-btn aa-btn--secondary aa-size-sm inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Copy size={13} />
          <span>{t('users.copyUuid', { defaultValue: 'Nusxalash' })}</span>
        </button>
      </div>

      {/* Profile & Contact Details */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-aa-ink-muted mb-3">
          {t('users.personalDetails', { defaultValue: 'Shaxsiy ma\'lumotlar' })}
        </h3>
        <div className="space-y-3">
          <DetailRow icon={Shield} label={t('users.colUsername')}>
            <span className="text-sm font-mono font-medium text-aa-ink">{user.username}</span>
          </DetailRow>

          {user.phone ? (
            <DetailRow icon={Phone} label={t('users.phone', { defaultValue: 'Telefon' })}>
              <a href={`tel:${user.phone}`} className="text-sm font-mono text-aa-brand hover:underline">
                {user.phone}
              </a>
            </DetailRow>
          ) : null}

          {user.email ? (
            <DetailRow icon={Mail} label={t('users.email')}>
              <a href={`mailto:${user.email}`} className="text-sm text-aa-ink hover:underline truncate block">
                {user.email}
              </a>
            </DetailRow>
          ) : null}

          <DetailRow icon={KeyRound} label={t('users.colCredentials', { defaultValue: 'Kirish turi' })}>
            <span className="text-sm text-aa-ink">
              {isPin
                ? t('users.credentialsPinProtected', { defaultValue: 'PIN-kod bilan himoyalangan' })
                : t('users.credentialsPasswordProtected', { defaultValue: 'Parol bilan himoyalangan' })}
            </span>
          </DetailRow>

          {user.createdAt ? (
            <DetailRow icon={Calendar} label={t('users.createdAt', { defaultValue: 'Yaratilgan sana' })}>
              <span className="text-sm text-aa-ink">{formatSimpleDate(user.createdAt)}</span>
            </DetailRow>
          ) : null}
        </div>
      </div>

      {/* Workplace Info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-aa-ink-muted mb-3">
          {t('users.workplaceDetails', { defaultValue: 'Kompaniya va filiallar' })}
        </h3>
        <div className="space-y-3">
          <DetailRow icon={Building2} label={t('users.colCompany')}>
            <span className="text-sm font-medium text-aa-ink">{companyDisplay}</span>
            {!isPlatformStaff && user.companyLoginCode ? (
              <span className="ml-2 font-mono text-xs text-aa-brand">#{user.companyLoginCode}</span>
            ) : null}
          </DetailRow>

          <DetailRow icon={Store} label={t('users.colStores', { defaultValue: 'Filiallar' })}>
            <span className="text-sm text-aa-ink">{storesDisplay}</span>
          </DetailRow>

          {!isPlatformStaff && locationText ? (
            <DetailRow icon={MapPin} label={t('geo.region', { defaultValue: 'Manzil' })}>
              <span className="text-sm text-aa-ink">{locationText}</span>
            </DetailRow>
          ) : null}
        </div>
      </div>
    </div>
  );
}
