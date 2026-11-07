import React, { useMemo, useState } from 'react';
import { BaseSelect, BaseCheckbox } from '../../../../components/ui';
import { userFormInputCls } from '../../utils/userFormModalUtils';

/**
 * UserFormStoreSelect
 * Store / Branch selector: single dropdown for cashiers/waiters, multi-select checklist for other roles.
 */
export default function UserFormStoreSelect({
  t,
  isPlatform,
  isRoleDisabled,
  isCashierRole,
  selectedStoreId,
  storesLoading,
  storesError,
  storeOptions,
  toggleStore,
  authCompanyName,
  authCompanyId,
  storeIds,
  setStoreIds,
}) {
  const [storeSearch, setStoreSearch] = useState('');

  const filteredStoreOptions = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return storeOptions;
    return storeOptions.filter((s) =>
      [s.name, s.code].filter(Boolean).some((part) => String(part).toLowerCase().includes(q))
    );
  }, [storeOptions, storeSearch]);

  if (isCashierRole) {
    return (
      <div>
        <BaseSelect
          id="user-form-store"
          label={t('users.colStoreSingle', { defaultValue: 'Filial' })}
          required
          value={selectedStoreId}
          disabled={isRoleDisabled || storesLoading || (storeOptions.length === 0 && !storesError)}
          placeholder={
            isRoleDisabled
              ? t('users.selectCompanyFirst', { defaultValue: 'Avval kompaniyani tanlang' })
              : storesLoading
                ? t('common.loading')
                : storeOptions.length === 0
                  ? t('users.noStoresAvailable', { defaultValue: 'Filiallar mavjud emas' })
                  : t('users.selectStore', { defaultValue: 'Filialni tanlang' })
          }
          onChange={(e) => {
            const next = e.target.value;
            if (!next) {
              setStoreIds(new Set());
              return;
            }
            toggleStore(next);
          }}
          options={storeOptions.map((s) => ({
            value: String(s.id),
            label: `${s.name}${s.active === false ? ` (${t('users.storeInactive', { defaultValue: 'Faol emas' })})` : ''}`,
            keywords: [s.name, s.code].filter(Boolean).join(' '),
          }))}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('users.cashierStoreHint', { defaultValue: 'Kassir va ofitsiantlar faqat bitta filialga biriktiriladi' })}
        </p>
        {storesError ? (
          <p className="mt-1 text-xs text-red-500">{t('users.storesLoadFailed')}</p>
        ) : null}
        {!isRoleDisabled && !storesLoading && !storesError && storeOptions.length === 0 ? (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            {isPlatform
              ? t('users.noStoresForSelectedCompany', { defaultValue: 'Tanlangan kompaniyada filiallar mavjud emas. Avval filial yarating.' })
              : t('users.noStoresForYourCompany', {
                  company: authCompanyName || (authCompanyId != null ? `#${authCompanyId}` : '—'),
                })}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {t('platform.stores', { defaultValue: 'Filiallar' })}
      </label>
      {storeOptions.length > 8 ? (
        <input
          type="search"
          value={storeSearch}
          onChange={(e) => setStoreSearch(e.target.value)}
          placeholder={t('stores.searchPlaceholder', { defaultValue: 'Filialni qidirish…' })}
          className={`${userFormInputCls} mb-2`}
        />
      ) : null}
      <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40">
        {isRoleDisabled ? (
          <p className="text-xs text-slate-400">{t('users.selectCompanyFirst', { defaultValue: 'Avval kompaniyani tanlang' })}</p>
        ) : storesLoading ? (
          <p className="text-xs text-slate-500">{t('common.loading')}</p>
        ) : storeOptions.length === 0 ? (
          <p className="text-xs text-slate-500">{t('users.noStoresAvailable', { defaultValue: 'Filiallar mavjud emas' })}</p>
        ) : filteredStoreOptions.length === 0 ? (
          <p className="text-xs text-slate-500">{t('platform.noSearchResults')}</p>
        ) : (
          filteredStoreOptions.map((s) => (
            <label key={s.id} className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <BaseCheckbox
                checked={storeIds.has(Number(s.id))}
                onChange={() => toggleStore(s.id)}
                size={18}
              />
              <span className={s.active === false ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}>
                {s.name}
                {s.active === false ? ` (${t('users.storeInactive', { defaultValue: 'Faol emas' })})` : ''}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
