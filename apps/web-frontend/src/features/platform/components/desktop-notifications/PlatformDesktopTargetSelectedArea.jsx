import React from 'react';
import { Building2, Check, Store } from 'lucide-react';

/**
 * Subcomponent for target companies/stores selection area.
 * Extracted from PlatformDesktopTargetStep for SRP and line count compliance (< 200 lines).
 */
export default function PlatformDesktopTargetSelectedArea({ p }) {
  const { t } = p;
  const isCompanies = p.targetType === 'COMPANIES';
  const companies = p.companies || [];
  const stores = p.stores || [];

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => p.setTargetType('COMPANIES')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
              isCompanies
                ? 'border-emerald-600 bg-white text-emerald-700 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                : 'border-transparent text-slate-600 hover:bg-slate-200/50 dark:text-slate-400'
            }`}
          >
            <Building2 size={13} />
            <span>{t('platform.desktopNotifications.targetTypeCompanies', { defaultValue: "Kompaniyalar bo'yicha" })}</span>
          </button>
          <button
            type="button"
            onClick={() => p.setTargetType('STORES')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
              !isCompanies
                ? 'border-emerald-600 bg-white text-emerald-700 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                : 'border-transparent text-slate-600 hover:bg-slate-200/50 dark:text-slate-400'
            }`}
          >
            <Store size={13} />
            <span>{t('platform.desktopNotifications.targetTypeStores', { defaultValue: "Filiallar bo'yicha" })}</span>
          </button>
        </div>

        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {isCompanies
            ? t('platform.desktopNotifications.selectedCompaniesCount', {
                count: p.selectedCompanyIds?.length || 0,
                defaultValue: `${p.selectedCompanyIds?.length || 0} ta kompaniya tanlandi`,
              })
            : t('platform.desktopNotifications.selectedStoresCount', {
                count: p.selectedStoreIds?.length || 0,
                defaultValue: `${p.selectedStoreIds?.length || 0} ta filial tanlandi`,
              })}
        </span>
      </div>

      {/* Quick search input */}
      <input
        type="text"
        value={p.targetSearchQuery || ''}
        onChange={(e) => p.setTargetSearchQuery?.(e.target.value)}
        placeholder={
          isCompanies
            ? t('platform.desktopNotifications.selectCompaniesPlaceholder', { defaultValue: 'Kompaniya nomini qidiring...' })
            : t('platform.desktopNotifications.selectStoresPlaceholder', { defaultValue: 'Filial nomini qidiring...' })
        }
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100"
      />

      {/* Items selector grid/list */}
      <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200/80 bg-white p-2 dark:border-slate-800 dark:bg-slate-850 space-y-1">
        {isCompanies ? (
          companies.length === 0 ? (
            <p className="p-2 text-center text-xs text-slate-400">Kompaniyalar topilmadi</p>
          ) : (
            companies.map((c) => {
              const isChecked = p.selectedCompanyIds?.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => p.toggleCompanyId(c.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <div className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 ${isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                </button>
              );
            })
          )
        ) : stores.length === 0 ? (
          <p className="p-2 text-center text-xs text-slate-400">Filiallar topilmadi</p>
        ) : (
          stores.map((s) => {
            const isChecked = p.selectedStoreIds?.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => p.toggleStoreId(s.id)}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="truncate">{s.name}</span>
                  {s.companyName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 font-normal">
                      {s.companyName}
                    </span>
                  )}
                </div>
                <div className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 ${isChecked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                  {isChecked && <Check size={12} strokeWidth={3} />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
