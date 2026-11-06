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
                {regionLabel}
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
  );
}
