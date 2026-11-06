import React from 'react';

/**
 * UserFormPersonalInfo
 * First name, last name, and optional patronymic inputs for UserFormModal.
 */
export default function UserFormPersonalInfo({
  t,
  register,
  errors,
  getInputCls,
  userFormInputCls,
  fieldOn,
}) {
  return (
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
  );
}
