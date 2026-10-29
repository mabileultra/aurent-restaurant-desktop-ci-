import React, { useMemo, useState } from 'react';
import { Loader, Eye, EyeOff, Sparkles } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { userFormInputCls } from '../../utils/userFormModalUtils';
import { buildCompanySelectOptions } from '../../utils/companySelectOptions';
import { formatUzbekPhone } from '../../utils/phoneFormatUtils';

export default function UserFormModalFields({
  t,
  isPlatform,
  isEdit,
  user,
  isCashierRole,
  isPinRole,
  pinRequired,
  pinFieldLabel,
  showPasswordField,
  fieldOn,
  companies,
  companyId,
  setCompanyId,
  handleCompanyChange,
  handleRoleChange,
  handleFormSubmit,
  setStoreIds,
  companyLoginCode,
  passwordVisible,
  setPasswordVisible,
  setPinDirty,
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
  onClose,
  handleSubmit,
  onSubmit,
  onUsernameChange,
}) {
  const [pinVisible, setPinVisible] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');

  const getInputCls = (hasError) =>
    hasError
      ? `${userFormInputCls} !border-red-500 focus:!ring-red-500 !text-slate-900 dark:!border-red-500`
      : userFormInputCls;

  const filteredStoreOptions = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return storeOptions;
    return storeOptions.filter((s) =>
      [s.name, s.code].filter(Boolean).some((part) => String(part).toLowerCase().includes(q))
    );
  }, [storeOptions, storeSearch]);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 10; i += 1) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', generated, { shouldDirty: true, shouldValidate: true });
    setPasswordVisible(true);
  };

  const isRoleDisabled = isPlatform && !isEdit && !companyId;

  return (
    <form
      id="user-form-modal"
      autoComplete="off"
      onSubmit={handleFormSubmit || handleSubmit(onSubmit)}
      className="flex flex-col flex-1 min-h-0"
    >
      {/* Chrome autofill dummy preventers */}
      <input
        type="text"
        name="chrome-autofill-prevent-username"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />
      <input
        type="password"
        name="chrome-autofill-prevent-password"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="new-password"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Existing User Platform Credentials Summary (Edit mode) */}
        {isPlatform && isEdit ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('users.currentCredentialsTitle', { defaultValue: 'Joriy hisob xulosasi' })}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {companyLoginCode ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{t('users.platformCompanyCode')}:</span>
                  <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                    #{companyLoginCode}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">{t('users.credentialsLogin')}:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{user?.username}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {isPinRole ? t('users.pinHiddenHint') : t('users.passwordHiddenHint')}
            </p>
          </div>
        ) : null}

        {/* 1. TASHKILOT VA ROL (Company & Role) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('users.sectionOrganization', { defaultValue: 'Tashkilot va Rol' })}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isPlatform && (
              <div>
                <BaseSelect
                  id="user-form-company"
                  label={t('users.colCompany')}
                  required
                  value={companyId}
                  error={errors.companyId?.message}
                  onChange={(e) => {
                    if (handleCompanyChange) handleCompanyChange(e.target.value);
                    else setCompanyId(e.target.value);
                    if (!isEdit) setStoreIds(new Set());
                  }}
                  disabled={isEdit}
                  placeholder={t('stores.selectCompany')}
                  searchPlaceholder={t('stores.searchCompany', { defaultValue: 'Kompaniyani qidirish…' })}
                  options={buildCompanySelectOptions(companies)}
                />
                {!isEdit && companyLoginCode ? (
                  <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                    <span>{t('users.platformCompanyCode')}:</span>
                    <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">#{companyLoginCode}</span>
                  </p>
                ) : null}
              </div>
            )}

            {(isPlatform || fieldOn('role') || !isEdit) ? (
              <div>
                <input type="hidden" {...register('role')} />
                <BaseSelect
                  id="user-form-role"
                  label={t('users.colRole')}
                  required
                  disabled={isRoleDisabled}
                  value={selectedRole}
                  error={errors.role?.message}
                  onChange={(e) => {
                    if (handleRoleChange) handleRoleChange(e.target.value);
                    else setValue('role', e.target.value, { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder={
                    isRoleDisabled
                      ? t('users.selectCompanyFirst', { defaultValue: 'Avval kompaniyani tanlang' })
                      : t('users.selectRole', { defaultValue: 'Rolni tanlang' })
                  }
                  searchable={false}
                  options={(
                    roleAllowList?.length
                      ? roleAllowList
                      : ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'COURIER', 'COOK', 'ACCOUNTANT']
                  ).map((role) => ({
                    value: role,
                    label: ({
                      ADMIN: t('users.roleAdmin', { defaultValue: 'Admin' }),
                      MANAGER: t('users.roleManager', { defaultValue: 'Menejer' }),
                      CASHIER: t('users.roleCashier', { defaultValue: 'Kassir' }),
                      WAITER: t('users.roleWaiter', { defaultValue: 'Ofitsiant' }),
                      COURIER: t('users.roleCourier', { defaultValue: 'Kuryer' }),
                      COOK: t('users.roleCook', { defaultValue: 'Oshpaz' }),
                      ACCOUNTANT: t('users.roleAccountant', { defaultValue: 'Buxgalter' }),
                    })[role] ?? t(`roles.${role}`, { defaultValue: role }),
                  }))}
                />
              </div>
            ) : null}
          </div>

          {/* Filiallar (Branches) */}
          {(isPlatform || fieldOn('stores') || isCashierRole) ? (
            <div>
              {isCashierRole ? (
                <>
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
                </>
              ) : (
                <>
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
                          <input
                            type="checkbox"
                            checked={storeIds.has(Number(s.id))}
                            onChange={() => toggleStore(s.id)}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 dark:border-slate-700"
                          />
                          <span className={s.active === false ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}>
                            {s.name}
                            {s.active === false ? ` (${t('users.storeInactive', { defaultValue: 'Faol emas' })})` : ''}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* 2. SHAXSIY MA'LUMOTLAR (Personal info) */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('users.sectionPersonalInfo', { defaultValue: 'Shaxsiy ma\'lumotlar' })}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-first-name" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('users.firstName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="user-first-name"
                {...register('firstName', { required: true })}
                className={getInputCls(errors.firstName)}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? 'user-first-name-error' : undefined}
                placeholder="Ism"
              />
              {errors.firstName && <p id="user-first-name-error" className="mt-1 text-xs text-red-500">{t('validation.required')}</p>}
            </div>

            <div>
              <label htmlFor="user-last-name" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('users.lastName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="user-last-name"
                {...register('lastName', { required: true })}
                className={getInputCls(errors.lastName)}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? 'user-last-name-error' : undefined}
                placeholder="Familiya"
              />
              {errors.lastName && <p id="user-last-name-error" className="mt-1 text-xs text-red-500">{t('validation.required')}</p>}
            </div>
          </div>

          {fieldOn('patronymic') && (
            <div>
              <label htmlFor="user-patronymic" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('users.patronymic')}{' '}
                <span className="text-xs font-normal text-slate-400">({t('common.optional', { defaultValue: 'Ixtiyoriy' })})</span>
              </label>
              <input
                id="user-patronymic"
                {...register('patronymic')}
                className={userFormInputCls}
                placeholder="Sharif (otasining ismi)"
              />
            </div>
          )}
        </div>

        {/* 3. KIRISH VA XAVFSIZLIK (Credentials & Security) */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t('users.sectionSecurity', { defaultValue: 'Kirish ma\'lumotlari' })}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-username" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('users.colUsername')} <span className="text-red-500">*</span>
              </label>
              <input
                id="user-username"
                {...register('username', {
                  required: true,
                  onChange: () => onUsernameChange?.(),
                })}
                autoComplete="new-username"
                className={getInputCls(errors.username)}
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'user-username-error' : undefined}
                placeholder="login_nomi"
              />
              {errors.username && <p id="user-username-error" className="mt-1 text-xs text-red-500">{t('validation.required')}</p>}
            </div>

            <div>
              <label htmlFor="user-phone" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('users.phone', { defaultValue: 'Telefon raqam' })}{' '}
                <span className="text-xs font-normal text-slate-400">({t('common.optional', { defaultValue: 'Ixtiyoriy' })})</span>
              </label>
              <input
                id="user-phone"
                type="tel"
                placeholder="+998 (90) 123-45-67"
                {...register('phone', {
                  onChange: (e) => {
                    const formatted = formatUzbekPhone(e.target.value);
                    setValue('phone', formatted, { shouldDirty: true });
                  },
                })}
                className={userFormInputCls}
              />
            </div>
          </div>

          {fieldOn('email') && (
            <div>
              <label htmlFor="user-email" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('users.email')}{' '}
                <span className="text-xs font-normal text-slate-400">({t('common.optional', { defaultValue: 'Ixtiyoriy' })})</span>
              </label>
              <input
                id="user-email"
                type="email"
                placeholder="kassir@misol.uz"
                {...register('email')}
                className={userFormInputCls}
              />
            </div>
          )}

          {/* PIN field for cashier/cook/waiter */}
          {isPinRole ? (
            <div>
              <label htmlFor="user-pin" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {pinFieldLabel || t('users.pin', { defaultValue: 'PIN-kod' })}
                {pinRequired ? <span className="text-red-500"> *</span> : null}
              </label>
              <div className="relative">
                <input
                  id="user-pin"
                  type={pinVisible ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="new-password"
                  placeholder={isEdit ? t('users.pinEditHint', { defaultValue: 'O\'zgartirish shart bo\'lmasa bo\'sh qoldiring' }) : '••••'}
                  {...register('pin', {
                    required: pinRequired,
                    onChange: (e) => {
                      const clean = (e.target.value || '').replace(/\D/g, '').slice(0, 6);
                      setValue('pin', clean, { shouldDirty: true, shouldValidate: true });
                      setPinDirty?.(true);
                    },
                  })}
                  className={`${getInputCls(errors.pin)} pr-10 font-mono tracking-widest`}
                  aria-invalid={Boolean(errors.pin)}
                  aria-describedby={errors.pin ? 'user-pin-error' : undefined}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={() => setPinVisible((v) => !v)}
                  aria-label={pinVisible ? t('users.hidePin', { defaultValue: 'PIN-kodni yashirish' }) : t('users.showPin', { defaultValue: 'PIN-kodni ko\'rsatish' })}
                >
                  {pinVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.pin ? (
                <p id="user-pin-error" className="mt-1 text-xs text-red-500">
                  {t('validation.required', { defaultValue: 'Majburiy maydon' })}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  {pinRequired
                    ? t('users.pinHint', { defaultValue: '4–6 xonali raqam. Kassa ekraniga tezkor kirish uchun ishlatiladi.' })
                    : t('users.pinEditHint', { defaultValue: 'O\'zgartirish shart bo\'lmasa bo\'sh qoldiring' })}
                </p>
              )}
            </div>
          ) : null}

          {/* Password field for admin/manager */}
          {showPasswordField ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="user-password" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t('users.password')}
                  {!isEdit ? <span className="text-red-500"> *</span> : null}
                </label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    <Sparkles size={12} />
                    {t('users.generatePassword', { defaultValue: 'Parol generatsiya qilish' })}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="user-password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={isEdit ? t('users.passwordEditPlaceholder', { defaultValue: 'O\'zgartirish uchun yangi parol kiriting' }) : undefined}
                  {...register('password', isEdit ? {} : { required: true, minLength: 6 })}
                  className={`${getInputCls(errors.password)} pr-10`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'user-password-error' : undefined}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={() => setPasswordVisible((v) => !v)}
                  aria-label={passwordVisible ? t('users.hidePassword') : t('users.showPassword')}
                >
                  {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isEdit && (
                <p className="mt-1 text-xs text-slate-400">
                  {isPlatform ? t('users.passwordHiddenHint') : t('users.passwordEditHint')}
                </p>
              )}
              {!isEdit && errors.password && (
                <p id="user-password-error" className="mt-1 text-xs text-red-500">
                  {errors.password.type === 'required'
                    ? t('validation.required', { defaultValue: 'Majburiy maydon' })
                    : t('users.passwordMinLength', { defaultValue: 'Parol kamida 6 belgidan iborat bo‘lishi kerak' })}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="admin-btn-primary px-6 py-2.5 text-sm font-semibold rounded-xl shadow-xs"
        >
          {isPending && <Loader size={15} className="mr-2 inline animate-spin" />}
          {isEdit ? t('common.save') : t('users.createUser')}
        </button>
      </div>
    </form>
  );
}
