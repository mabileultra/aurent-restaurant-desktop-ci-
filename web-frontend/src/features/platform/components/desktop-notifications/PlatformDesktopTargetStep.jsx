import React from 'react';
import { Building2, Check, Monitor, Store } from 'lucide-react';

export default function PlatformDesktopTargetStep({ p }) {
  const { t } = p;
  const isSelect = p.targetScope === 'SELECT';
  const isCompanies = p.targetType === 'COMPANIES';

  const companies = p.companies || [];
  const stores = p.stores || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          1
        </span>
        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
          {t('platform.desktopNotifications.stepTarget')}
        </h3>
      </div>

      {/* Scope Switcher Tabs */}
      <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => p.setTargetScope('ALL')}
          aria-pressed={!isSelect}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            !isSelect
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('platform.desktopNotifications.targetAll')}
        </button>
        <button
          type="button"
          onClick={() => p.setTargetScope('SELECT')}
          aria-pressed={isSelect}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            isSelect
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('platform.desktopNotifications.targetSelect')}
        </button>
      </div>

      {!isSelect ? (
        /* ALL registers info card */
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-850">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
            <Monitor size={17} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {p.activeCount != null
                ? `${t('platform.desktopNotifications.registersCount', { count: p.activeCount })}${
                    p.onlineRegistersCount != null ? ` · ${t('platform.desktopNotifications.onlineCount', { defaultValue: `Hozir onlayn: ${p.onlineRegistersCount}` })}` : ''
                  }`
                : t('platform.desktopNotifications.registersCountUnknown', { defaultValue: 'Noma‘lum (barcha faol kassalar)' })}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('platform.desktopNotifications.allCompaniesOfflineNote')}
            </p>
          </div>
        </div>
      ) : (
        /* Targeted Selection Area */
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
                ? t('platform.desktopNotifications.selectedCompaniesCount', { count: p.selectedCompanyIds?.length || 0, defaultValue: `${p.selectedCompanyIds?.length || 0} ta kompaniya tanlandi` })
                : t('platform.desktopNotifications.selectedStoresCount', { count: p.selectedStoreIds?.length || 0, defaultValue: `${p.selectedStoreIds?.length || 0} ta filial tanlandi` })}
            </span>
          </div>

          {/* Quick search input */}
          <input
            type="text"
            value={p.searchQuery || ''}
            onChange={(e) => p.setSearchQuery?.(e.target.value)}
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
      )}
    </div>
  );
}
