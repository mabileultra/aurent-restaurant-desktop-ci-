import React from 'react';
import { Building2, Hash, MapPin, Phone } from 'lucide-react';
import { formatUzPhone } from '../../../../utils/phoneUz';

export default function PlatformStoreQuickDrawerDetails({
  store,
  regionLabel,
  t,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Asosiy ma'lumotlar */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-aa-ink-muted">
          {t('platform.drawerGeneralInfo', { defaultValue: 'Umumiy ma’lumotlar' })}
        </h3>

        <div className="rounded-aa-lg border border-aa-line divide-y divide-aa-line bg-aa-surface text-sm">
          {/* Kompaniya */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-aa-ink-muted">
              <Building2 size={16} />
              <span>{t('stores.colCompany', { defaultValue: 'Kompaniya' })}</span>
            </div>
            <span className="font-medium text-aa-ink truncate max-w-[200px]">
              {store.companyName || '—'}
            </span>
          </div>

          {/* Filial ID */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-aa-ink-muted">
              <Hash size={16} />
              <span>ID</span>
            </div>
            <span className="font-mono text-xs font-medium text-aa-ink">
              #{store.id}
            </span>
          </div>

          {/* Telefon */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-aa-ink-muted">
              <Phone size={16} />
              <span>{t('stores.colPhone', { defaultValue: 'Telefon' })}</span>
            </div>
            <span className="font-mono text-xs font-medium text-aa-ink">
              {store.phone ? formatUzPhone(store.phone) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Joylashuv va manzil */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-aa-ink-muted">
          {t('platform.drawerLocationInfo', { defaultValue: 'Joylashuv va manzil' })}
        </h3>

        <div className="p-4 rounded-aa-lg border border-aa-line space-y-3 bg-aa-surface-sunken text-sm">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-aa-ink-muted shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-aa-ink">
                {regionLabel}
              </div>
              {store.address && (
                <div className="text-xs text-aa-ink-muted">
                  {store.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
