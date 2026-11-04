import { useMemo, useState } from 'react';
import { Loader, Eye, EyeOff } from 'lucide-react';
import { BaseButton, BaseInput, BaseSelect } from '../../../../components/ui';
import { buildCompanySelectOptions } from '../../utils/companySelectOptions';

export default function UserFormModalFields({
  t,
  isPlatform,
  isEdit,
  user,
  isCashierRole,
  isPinRole,
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
    <form onSubmit={handleSubmit(onSubmit)} className="user-form-modal">
      {isPlatform && isEdit ? (
        <div className="user-form-modal__cred-panel">
          <p className="user-form-modal__section-title">{t('users.platformCredentialsTitle')}</p>
          {companyLoginCode ? (
            <p>
              <span className="user-form-modal__muted">{t('users.platformCompanyCode')}:</span>{' '}
              <span className="user-form-modal__mono">{companyLoginCode}</span>
            </p>
          ) : null}
          <p>
            <span className="user-form-modal__muted">{t('users.credentialsLogin')}:</span>{' '}
            <span className="user-form-modal__mono">{user?.username}</span>
          </p>
          <p className="user-form-modal__hint">
            {isPinRole ? t('users.pinHiddenHint') : t('users.passwordHiddenHint')}
          </p>
        </div>
      ) : null}

      {isPlatform && !isEdit && companyLoginCode ? (
        <p className="user-form-modal__hint">
          {t('users.platformCompanyCode')}: <span className="user-form-modal__mono">{companyLoginCode}</span>
        </p>
      ) : null}

      {fioFields.map(({ name, label }) => (
        <BaseInput
          key={name}
          label={label}
          required
          {...register(name, { required: true })}
          error={errors[name] ? t('validation.required') : undefined}
        />
      ))}

      <BaseInput
        label={t('users.colUsername')}
        required
        autoComplete="username"
        {...register('username', { required: true })}
        error={errors.username ? t('validation.required') : undefined}
      />

      {isPinRole ? (
        <div className="rst-admin-field">
          <BaseInput
            label={t('users.pin', { defaultValue: 'PIN-код кассира' })}
            required={pinRequired}
            inputMode="numeric"
            autoComplete="off"
            placeholder={isEdit ? t('users.pinEditHint', { defaultValue: 'Оставьте пустым, если менять PIN не нужно' }) : '••••'}
            {...register('pin', {
              required: pinRequired,
              onChange: () => setPinDirty?.(true),
            })}
          />
          <p className="user-form-modal__hint">
            {pinRequired
              ? t('users.pinHint', { defaultValue: '4–6 цифр. Используется для входа кассира и разблокировки.' })
              : t('users.pinEditHint', { defaultValue: 'Оставьте пустым, если менять PIN не нужно' })}
          </p>
        </div>
      ) : null}

      {fieldOn('email') ? (
        <BaseInput
          type="email"
          label={t('users.email')}
          required
          {...register('email', { required: true })}
        />
      ) : null}

      {showPasswordField ? (
        <div className="rst-admin-field user-form-modal__password">
          <BaseInput
            type={passwordVisible ? 'text' : 'password'}
            label={t('users.password')}
            required={!isEdit}
            autoComplete="new-password"
            placeholder={isEdit ? t('users.passwordEditPlaceholder') : undefined}
            {...register('password', isEdit ? {} : { required: true, minLength: 6 })}
            error={!isEdit && errors.password ? t('users.passwordMinLength') : undefined}
          />
          <button
            type="button"
            className="user-form-modal__eye"
            onClick={() => setPasswordVisible((v) => !v)}
            aria-label={passwordVisible ? t('users.hidePassword') : t('users.showPassword')}
          >
            {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {isEdit ? (
            <p className="user-form-modal__hint">
              {isPlatform ? t('users.passwordHiddenHint') : t('users.passwordEditHint')}
            </p>
          ) : null}
        </div>
      ) : null}

      {isPlatform ? (
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
      ) : null}

      {(isPlatform || fieldOn('role') || !isEdit) ? (
        <>
          <input type="hidden" {...register('role')} />
          <BaseSelect
            label={t('users.role')}
            value={selectedRole}
            onChange={(e) => setValue('role', e.target.value, { shouldDirty: true, shouldValidate: true })}
            options={(
              roleAllowList?.length
                ? roleAllowList
                : isPlatform
                  ? ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'COURIER', 'COOK', 'ACCOUNTANT']
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
        </>
      ) : null}

      {(isPlatform || fieldOn('stores') || isCashierRole) ? (
        <div className="rst-admin-field">
          {isCashierRole ? (
            <>
              <BaseSelect
                label={t('users.colStores')}
                required
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
              <p className="user-form-modal__hint">{t('users.cashierStoreHint')}</p>
              {storesError ? (
                <p className="user-form-modal__error">{t('users.storesLoadFailed')}</p>
              ) : null}
              {!storesLoading && !storesError && storeOptions.length === 0 ? (
                <p className="user-form-modal__warn">
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
              <span className="rst-admin-field__label">{t('users.colStores')}</span>
              {storeOptions.length > 8 ? (
                <BaseInput
                  type="search"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder={t('stores.searchPlaceholder')}
                />
              ) : null}
              <div className="user-form-modal__stores">
                {storesLoading ? (
                  <p className="user-form-modal__hint">{t('common.loading')}</p>
                ) : storeOptions.length === 0 ? (
                  <p className="user-form-modal__hint">{t('users.noStoresAvailable')}</p>
                ) : filteredStoreOptions.length === 0 ? (
                  <p className="user-form-modal__hint">{t('platform.noSearchResults')}</p>
                ) : (
                  filteredStoreOptions.map((s) => (
                    <label key={s.id} className="user-form-modal__store-row">
                      <input
                        type="checkbox"
                        checked={storeIds.has(Number(s.id))}
                        onChange={() => toggleStore(s.id)}
                      />
                      <span className={s.active === false ? 'is-inactive' : undefined}>
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

      <div className="user-form-modal__actions">
        <BaseButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          {t('common.cancel')}
        </BaseButton>
        <BaseButton type="submit" disabled={isPending}>
          {isPending ? <Loader size={14} className="user-form-modal__spinner" /> : null}
          {isEdit ? t('common.save') : t('users.createUser')}
        </BaseButton>
      </div>
    </form>
  );
}
