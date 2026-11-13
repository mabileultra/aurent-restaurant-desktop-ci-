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
      ? `${userFormInputCls} !border-aa-danger focus:!ring-aa-danger !text-aa-ink`
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
          <div className="rounded-aa-md border border-aa-line bg-aa-surface-sunken px-4 py-3.5">
            <p className="text-[13px] font-semibold text-aa-ink-muted">
              {t('users.currentCredentialsTitle', { defaultValue: 'Joriy hisob xulosasi' })}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {companyLoginCode ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-aa-ink-muted">{t('users.platformCompanyCode')}:</span>
                  <span className="font-mono font-semibold px-1.5 py-0.5 rounded-aa-sm bg-aa-surface border border-aa-line text-aa-ink text-xs">
                    #{companyLoginCode}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5">
                <span className="text-aa-ink-muted">{t('users.credentialsLogin')}:</span>
                <span className="font-mono font-semibold text-aa-ink">{user?.username}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-aa-ink-muted">
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
        <div className="pt-2 border-t border-aa-line">
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
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-aa-line bg-aa-surface-sunken px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="aa-btn aa-btn--secondary aa-size-md cursor-pointer"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={isPending || isActionBlocked}
          title={isActionBlocked ? blockReason : undefined}
          className="aa-btn aa-btn--primary aa-size-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending && <Loader size={15} className="mr-2 inline animate-spin" />}
          {isEdit ? t('common.save') : t('users.createUser')}
        </button>
      </div>
    </form>
  );
}
