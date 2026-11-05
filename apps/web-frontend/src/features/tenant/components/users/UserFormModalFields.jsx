import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { useOnlineActionGuard } from '../../../../hooks/useOnlineActionGuard';
import { userFormInputCls } from '../../utils/userFormModalUtils';
import UserFormOrgSection from './UserFormOrgSection';
import UserFormPersonalInfo from './UserFormPersonalInfo';
import UserFormSecurityFields from './UserFormSecurityFields';

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
  const { isActionBlocked, blockReason } = useOnlineActionGuard();
  const [pinVisible, setPinVisible] = useState(false);

  const getInputCls = (hasError) =>
    hasError
      ? `${userFormInputCls} !border-red-500 focus:!ring-red-500 !text-slate-900 dark:!border-red-500`
      : userFormInputCls;

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
      <input type="text" name="chrome-autofill-prevent-username" className="hidden" aria-hidden="true" tabIndex={-1} autoComplete="off" />
      <input type="password" name="chrome-autofill-prevent-password" className="hidden" aria-hidden="true" tabIndex={-1} autoComplete="new-password" />

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

        {/* 1. TASHKILOT VA ROL (Company & Role & Stores) */}
        <UserFormOrgSection
          t={t}
          isPlatform={isPlatform}
          isEdit={isEdit}
          companyId={companyId}
          setCompanyId={setCompanyId}
          handleCompanyChange={handleCompanyChange}
          companies={companies}
          companyLoginCode={companyLoginCode}
          errors={errors}
          setStoreIds={setStoreIds}
          register={register}
          isRoleDisabled={isRoleDisabled}
          selectedRole={selectedRole}
          handleRoleChange={handleRoleChange}
          setValue={setValue}
          roleAllowList={roleAllowList}
          fieldOn={fieldOn}
          isCashierRole={isCashierRole}
          selectedStoreId={selectedStoreId}
          storesLoading={storesLoading}
          storesError={storesError}
          storeOptions={storeOptions}
          toggleStore={toggleStore}
          authCompanyName={authCompanyName}
          authCompanyId={authCompanyId}
          storeIds={storeIds}
        />

        {/* 2. SHAXSIY MA'LUMOTLAR (Personal info) */}
        <UserFormPersonalInfo
          t={t}
          register={register}
          errors={errors}
          getInputCls={getInputCls}
          userFormInputCls={userFormInputCls}
          fieldOn={fieldOn}
        />

        {/* 3. KIRISH VA XAVFSIZLIK (Credentials & Security) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <UserFormSecurityFields
            t={t}
            register={register}
            errors={errors}
            getInputCls={getInputCls}
            userFormInputCls={userFormInputCls}
            onUsernameChange={onUsernameChange}
            fieldOn={fieldOn}
            setValue={setValue}
            isPinRole={isPinRole}
            pinFieldLabel={pinFieldLabel}
            pinRequired={pinRequired}
            pinVisible={pinVisible}
            setPinVisible={setPinVisible}
            isEdit={isEdit}
            setPinDirty={setPinDirty}
            showPasswordField={showPasswordField}
            handleGeneratePassword={handleGeneratePassword}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            isPlatform={isPlatform}
          />
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
          disabled={isPending || isActionBlocked}
          title={isActionBlocked ? blockReason : undefined}
          className="admin-btn-primary px-6 py-2.5 text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending && <Loader size={15} className="mr-2 inline animate-spin" />}
          {isEdit ? t('common.save') : t('users.createUser')}
        </button>
      </div>
    </form>
  );
}
