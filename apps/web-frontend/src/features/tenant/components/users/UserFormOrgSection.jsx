import React from 'react';
import { BaseSelect } from '../../../../components/ui';
import { useCompanySearchOptions } from '../../hooks/useCompanySearchOptions';
import UserFormStoreSelect from './UserFormStoreSelect';

/**
 * UserFormOrgSection
 * Organization, company, role and store branch selector for UserFormModal.
 */
export default function UserFormOrgSection({
  t,
  isPlatform,
  isEdit,
  companyId,
  setCompanyId,
  handleCompanyChange,
  companies,
  companyLoginCode,
  errors,
  setStoreIds,
  register,
  isRoleDisabled,
  selectedRole,
  handleRoleChange,
  setValue,
  roleAllowList,
  fieldOn,
  isCashierRole,
  selectedStoreId,
  storesLoading,
  storesError,
  storeOptions,
  toggleStore,
  authCompanyName,
  authCompanyId,
  storeIds,
}) {
  const companySearch = useCompanySearchOptions({
    initialCompanies: companies,
    selectedCompanyId: companyId,
    enabled: isPlatform,
    emptyLabel: undefined,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-[13px] font-semibold text-aa-ink-muted">
        {t('users.sectionOrganization', { defaultValue: 'Tashkilot va Rol' })}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isPlatform && (
          <div>
            <BaseSelect
              id="user-form-company"
              variant="aa"
              size="md"
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
              options={companySearch.options}
              onSearchQueryChange={companySearch.onSearchQueryChange}
            />
            {!isEdit && companyLoginCode ? (
              <p className="mt-1.5 text-xs text-aa-ink-muted flex items-center gap-1">
                <span>{t('users.platformCompanyCode')}:</span>
                <span className="font-mono font-semibold px-1.5 py-0.5 rounded-aa-sm bg-aa-surface-sunken border border-aa-line text-aa-ink-muted">#{companyLoginCode}</span>
              </p>
            ) : null}
          </div>
        )}

        {(isPlatform || fieldOn('role') || !isEdit) ? (
          <div>
            <input type="hidden" {...register('role')} />
            <BaseSelect
              id="user-form-role"
              variant="aa"
              size="md"
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
        <UserFormStoreSelect
          t={t}
          isPlatform={isPlatform}
          isRoleDisabled={isRoleDisabled}
          isCashierRole={isCashierRole}
          selectedStoreId={selectedStoreId}
          storesLoading={storesLoading}
          storesError={storesError}
          storeOptions={storeOptions}
          toggleStore={toggleStore}
          authCompanyName={authCompanyName}
          authCompanyId={authCompanyId}
          storeIds={storeIds}
          setStoreIds={setStoreIds}
        />
      ) : null}
    </div>
  );
}
