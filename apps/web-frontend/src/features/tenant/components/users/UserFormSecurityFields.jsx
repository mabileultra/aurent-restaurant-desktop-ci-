import React from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { formatUzbekPhone } from '../../utils/phoneFormatUtils';

/**
 * UserFormSecurityFields
 * Renders security, credentials, email, phone, PIN and password inputs.
 */
export default function UserFormSecurityFields(props) {
  const {
    t, register, errors, getInputCls, onUsernameChange, fieldOn, setValue,
    isPinRole, pinFieldLabel, pinRequired, pinVisible, setPinVisible, isEdit,
    setPinDirty, showPasswordField, handleGeneratePassword, passwordVisible,
    setPasswordVisible, isPlatform,
  } = props;

  return (
    <div className="space-y-4">
      <h3 className="text-[13px] font-semibold text-aa-ink-muted">
        {t('users.sectionSecurity', { defaultValue: 'Kirish ma\'lumotlari' })}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="user-username" className="mb-1 block text-xs font-medium text-aa-ink">
            {t('users.colUsername')} <span className="text-aa-danger">*</span>
          </label>
          <input
            id="user-username"
            {...register('username', { required: true, onChange: () => onUsernameChange?.() })}
            autoComplete="new-username"
            className={getInputCls(errors.username)}
            aria-invalid={Boolean(errors.username)}
            placeholder="login_nomi"
          />
          {errors.username && (
            <p id="user-username-error" className="mt-1 text-xs text-aa-danger">
              {errors.username.message || t('validation.required', { defaultValue: 'Majburiy maydon' })}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="user-phone" className="mb-1 block text-xs font-medium text-aa-ink">
            {t('users.phone', { defaultValue: 'Telefon raqam' })}{' '}
            <span className="text-xs font-normal text-aa-ink-muted">({t('common.optional', { defaultValue: 'Ixtiyoriy' })})</span>
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
            className={getInputCls(errors.phone)}
          />
          {errors.phone && <p id="user-phone-error" className="mt-1 text-xs text-aa-danger">{errors.phone.message}</p>}
        </div>
      </div>

      {fieldOn('email') && (
        <div>
          <label htmlFor="user-email" className="mb-1 block text-xs font-medium text-aa-ink">
            {t('users.email')} <span className="text-xs font-normal text-aa-ink-muted">({t('common.optional', { defaultValue: 'Ixtiyoriy' })})</span>
          </label>
          <input
            id="user-email"
            type="email"
            placeholder="kassir@misol.uz"
            {...register('email')}
            className={getInputCls(errors.email)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <p id="user-email-error" className="mt-1 text-xs text-aa-danger">
              {errors.email.message || t('validation.invalidEmail', { defaultValue: 'Email noto‘g‘ri' })}
            </p>
          )}
        </div>
      )}

      {/* PIN field for cashier/cook/waiter */}
      {isPinRole ? (
        <div>
          <label htmlFor="user-pin" className="mb-1 block text-xs font-medium text-aa-ink">
            {pinFieldLabel || t('users.pin', { defaultValue: 'PIN-kod' })}
            {pinRequired ? <span className="text-aa-danger"> *</span> : null}
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
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-aa-ink-muted hover:text-aa-ink"
              onClick={() => setPinVisible((v) => !v)}
              aria-label={pinVisible ? t('users.hidePin', { defaultValue: 'PIN-kodni yashirish' }) : t('users.showPin', { defaultValue: 'PIN-kodni ko\'rsatish' })}
            >
              {pinVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.pin ? (
            <p id="user-pin-error" className="mt-1 text-xs text-aa-danger">
              {errors.pin.message || t('validation.required', { defaultValue: 'Majburiy maydon' })}
            </p>
          ) : (
            <p className="mt-1 text-xs text-aa-ink-muted">
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
            <label htmlFor="user-password" className="block text-xs font-medium text-aa-ink">
              {t('users.password')}{!isEdit ? <span className="text-aa-danger"> *</span> : null}
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="inline-flex items-center gap-1 text-xs font-medium text-aa-brand hover:underline cursor-pointer"
            >
              <Sparkles size={12} />
              {t('users.generatePassword', { defaultValue: 'Parol generatsiya qilish' })}
            </button>
          </div>
          <div className="relative">
            <input
              id="user-password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={isEdit ? t('users.passwordEditPlaceholder', { defaultValue: 'O\'zgartirish uchun yangi parol kiriting' }) : undefined}
              {...register('password')}
              className={`${getInputCls(errors.password)} pr-10`}
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-aa-ink-muted hover:text-aa-ink"
              onClick={() => setPasswordVisible((v) => !v)}
              aria-label={passwordVisible ? t('users.hidePassword', { defaultValue: 'Parolni yashirish' }) : t('users.showPassword', { defaultValue: 'Parolni ko\'rsatish' })}
            >
              {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {isEdit && (
            <p className="mt-1 text-xs text-aa-ink-muted">{isPlatform ? t('users.passwordHiddenHint') : t('users.passwordEditHint')}</p>
          )}
          {errors.password && (
            <p id="user-password-error" className="mt-1 text-xs text-aa-danger">
              {errors.password.message || (errors.password.type === 'required'
                ? t('validation.required', { defaultValue: 'Majburiy maydon' })
                : t('users.passwordMinLength', { defaultValue: 'Parol kamida 8 belgidan iborat bo‘lishi kerak' }))}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
