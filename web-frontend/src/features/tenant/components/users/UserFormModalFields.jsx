import { useMemo, useState } from 'react';
import { Loader, Eye, EyeOff } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { userFormInputCls } from '../../utils/userFormModalUtils';
import { buildCompanySelectOptions } from '../../utils/companySelectOptions';

export default function UserFormModalFields({
  t,
  isPlatform,
  isEdit,
  user,
  isCashierRole,
  pinRequired,
  showPasswordField,
  fieldOn,
  companies,
  companyId,
  setCompanyId,
  setStoreIds,
  companyLoginCode,
  passwordVisible,
  setPasswordVisible,
  register,
  setValue,
  selectedRole,
  roleAllowList,
  errors,
  isPending,
  storeIds,
  selectedStoreId,
  storesLoading,
  storesError,
  authCompanyId,
  authCompanyName,
  toggleStore,
  storeOptions,
  fioFields,
  onClose,
  handleSubmit,
  onSubmit,
}) {
  const [storeSearch, setStoreSearch] = useState('');
  const filteredStoreOptions = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return storeOptions;
    return storeOptions.filter((s) =>
      [s.name, s.code].filter(Boolean).some((part) => String(part).toLowerCase().includes(q))
    );
  }, [storeOptions, storeSearch]);
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
      {isPlatform && isEdit ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('users.platformCredentialsTitle')}
          </p>
          {companyLoginCode ? (
            <p className="mt-2 text-sm">
              <span className="text-slate-500">{t('users.platformCompanyCode')}:</span>{' '}
              <span className="font-mono font-semibold">{companyLoginCode}</span>
            </p>
          ) : null}
          <p className="mt-1 text-sm">
            <span className="text-slate-500">{t('users.credentialsLogin')}:</span>{' '}
            <span className="font-mono font-semibold">{user?.username}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {isCashierRole ? t('users.pinHiddenHint') : t('users.passwordHiddenHint')}
          </p>
        </div>
      ) : null}
      {isPlatform && !isEdit && companyLoginCode ? (
        <div className="admin-soft-panel px-3 py-2 text-xs">
          {t('users.platformCompanyCode')}: <span className="font-mono font-semibold">{companyLoginCode}</span>
        </div>
      ) : null}
      {fioFields.map(({ name, label }) => (
        <div key={name}>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{label} *</label>
          <input {...register(name, { required: true })} className={userFormInputCls} />
          {errors[name] && <p className="mt-1 text-xs text-red-400">{t('validation.required')}</p>}
        </div>
      ))}
      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t('users.colUsername')} *</label>
        <input
          {...register('username', { required: true })}
          autoComplete="username"
          className={userFormInputCls}
        />
        {errors.username && <p className="mt-1 text-xs text-red-400">{t('validation.required')}</p>}
      </div>
      {isCashierRole ? (
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t('users.pin', { defaultValue: 'PIN-код кассира' })}
            {pinRequired ? ' *' : ''}
          </label>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••"
            {...register('pin', { required: pinRequired })}
            className={userFormInputCls}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {pinRequired
              ? t('users.pinHint', { defaultValue: '4–6 цифр. Используется для входа кассира и разблокировки.' })
              : t('users.pinEditHint', { defaultValue: 'Оставьте пустым, если менять PIN не нужно' })}
          </p>
        </div>
      ) : null}
      {fieldOn('email') ? (
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t('users.email')} *</label>
          <input type="email" {...register('email', { required: true })} className={userFormInputCls} />
        </div>
      ) : null}
      {showPasswordField ? (
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            {t('users.password')}
            {!isEdit ? ' *' : ''}
          </label>
          <div className="relative">
            <input
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={isEdit ? t('users.passwordEditPlaceholder') : undefined}
              {...register('password', isEdit ? {} : { required: true, minLength: 6 })}
              className={`${userFormInputCls} pr-10`}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              onClick={() => setPasswordVisible((v) => !v)}
              aria-label={passwordVisible ? t('users.hidePassword') : t('users.showPassword')}
            >
              {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {isEdit && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isPlatform ? t('users.passwordHiddenHint') : t('users.passwordEditHint')}
            </p>
          )}
          {!isEdit && errors.password && (
            <p className="mt-1 text-xs text-red-400">{t('users.passwordMinLength')}</p>
          )}
        </div>
      ) : null}
      {isPlatform && (
        <div>
          <BaseSelect
            label={t('users.colCompany')}
            required
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              if (!isEdit) setStoreIds(new Set());
            }}
            disabled={isEdit}
            placeholder={t('stores.selectCompany')}
            searchPlaceholder={t('stores.searchCompany', { defaultValue: 'Поиск компании…' })}
            options={buildCompanySelectOptions(companies, { emptyLabel: t('stores.selectCompany') })}
          />
        </div>
      )}
      {(isPlatform || fieldOn('role') || !isEdit) ? (
        <div>
          <input type="hidden" {...register('role')} />
          <BaseSelect
            label={t('users.role')}
            value={selectedRole}
            onChange={(e) => setValue('role', e.target.value, { shouldDirty: true, shouldValidate: true })}
            options={(
              roleAllowList?.length
                ? roleAllowList
                : ['MANAGER', 'CASHIER', 'WAITER', 'COURIER', 'COOK', 'ACCOUNTANT']
            ).map((role) => ({
              value: role,
              label: ({
                ADMIN: t('users.roleAdmin'),
                MANAGER: t('users.roleManager'),
                CASHIER: t('users.roleCashier'),
                WAITER: t('users.roleWaiter'),
                COURIER: t('users.roleCourier'),
                COOK: t('users.roleCook'),
                ACCOUNTANT: t('users.roleAccountant'),
              })[role] ?? t(`roles.${role}`, { defaultValue: role }),
            }))}
          />
        </div>
      ) : null}
      {(isPlatform || fieldOn('stores') || isCashierRole) ? (
        <div>
          {isCashierRole ? (
            <>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="text-red-400">* </span>
                {t('users.colStores')}
              </label>
              <BaseSelect
                value={selectedStoreId}
                disabled={storesLoading || (storeOptions.length === 0 && !storesError)}
                placeholder={
                  storesLoading
                    ? t('common.loading')
                    : storeOptions.length === 0
                      ? t('users.noStoresAvailable')
                      : t('users.selectStore')
                }
                onChange={(e) => {
                  const next = e.target.value;
                  if (!next) {
                    setStoreIds(new Set());
                    return;
                  }
                  toggleStore(next);
                }}
                options={[
                  {
                    value: '',
                    label: storesLoading
                      ? t('common.loading')
                      : storeOptions.length === 0
                        ? t('users.noStoresAvailable')
                        : t('users.selectStore'),
                  },
                  ...storeOptions.map((s) => ({
                    value: String(s.id),
                    label: `${s.name}${s.active === false ? ` (${t('users.storeInactive')})` : ''}`,
                    keywords: [s.name, s.code].filter(Boolean).join(' '),
                  })),
                ]}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('users.cashierStoreHint')}</p>
              {storesError ? (
                <p className="mt-1 text-xs text-red-500">{t('users.storesLoadFailed')}</p>
              ) : null}
              {!storesLoading && !storesError && storeOptions.length === 0 ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {isPlatform
                    ? t('users.noStoresForSelectedCompany')
                    : t('users.noStoresForYourCompany', {
                        company: authCompanyName || (authCompanyId != null ? `#${authCompanyId}` : '—'),
                      })}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">{t('users.colStores')}</label>
              {storeOptions.length > 8 ? (
                <input
                  type="search"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder={t('stores.searchPlaceholder')}
                  className={`${userFormInputCls} mb-2`}
                />
              ) : null}
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3 dark:border-slate-700">
                {storesLoading ? (
                  <p className="text-xs text-slate-500">{t('common.loading')}</p>
                ) : storeOptions.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('users.noStoresAvailable')}</p>
                ) : filteredStoreOptions.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('platform.noSearchResults')}</p>
                ) : (
                  filteredStoreOptions.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={storeIds.has(Number(s.id))}
                        onChange={() => toggleStore(s.id)}
                      />
                      <span className={s.active === false ? 'text-amber-600 dark:text-amber-400' : ''}>
                        {s.name}
                        {s.active === false ? ` (${t('users.storeInactive')})` : ''}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-slate-300 py-2.5 dark:border-slate-600"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="admin-btn-primary flex-1 py-2.5 text-sm"
        >
          {isPending && <Loader size={14} className="mr-1 inline animate-spin" />}
          {isEdit ? t('common.save') : t('users.createUser')}
        </button>
      </div>
    </form>
  );
}
