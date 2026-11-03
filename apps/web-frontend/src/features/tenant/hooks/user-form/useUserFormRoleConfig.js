import { useMemo } from 'react';
import { resolveUserFormRoles } from '../../../platform/utils/rolesByBusinessType';

/**
 * useUserFormRoleConfig
 * Computes role allowlist, PIN/password flags, labels, and company login code.
 */
export function useUserFormRoleConfig({
  t,
  isPlatform,
  isEdit,
  user,
  companyId,
  companies,
  companiesRaw,
  allowedRoles,
  businessTypeFilter,
  selectedRole,
}) {
  const selectedCompany = useMemo(() => {
    if (!isPlatform) return null;
    const id = isEdit ? user?.companyId : companyId ? Number(companyId) : null;
    if (!id) return null;
    return companies.find((c) => Number(c.id) === Number(id))
      ?? (companiesRaw || []).find((c) => Number(c.id) === Number(id))
      ?? null;
  }, [isPlatform, isEdit, user?.companyId, companyId, companies, companiesRaw]);

  const roleAllowList = useMemo(
    () => resolveUserFormRoles({
      allowedRoles,
      isPlatform,
      companyBusinessType: selectedCompany?.businessType,
      filterBusinessType: businessTypeFilter,
    }),
    [allowedRoles, isPlatform, selectedCompany?.businessType, businessTypeFilter],
  );

  const isCashierRole = selectedRole === 'CASHIER' || selectedRole === 'WAITER';
  const isPinRole = isCashierRole || selectedRole === 'COOK';
  const pinRequired = !isEdit || (isPinRole && user?.role !== 'CASHIER' && user?.role !== 'WAITER' && user?.role !== 'COOK');
  const showPasswordField = !isPinRole;

  const pinFieldLabel = useMemo(() => {
    if (selectedRole === 'COOK') return t('users.pinCook', { defaultValue: 'Oshpaz PIN-kodi' });
    if (selectedRole === 'WAITER') return t('users.pinWaiter', { defaultValue: 'Ofitsiant PIN-kodi' });
    if (selectedRole === 'CASHIER') return t('users.pinCashier', { defaultValue: 'Kassir PIN-kodi' });
    return t('users.pin', { defaultValue: 'PIN-kod' });
  }, [selectedRole, t]);

  const companyLoginCode =
    (isEdit ? user?.companyLoginCode : selectedCompany?.loginCode) || null;

  return {
    selectedCompany,
    roleAllowList,
    isCashierRole,
    isPinRole,
    pinRequired,
    showPasswordField,
    pinFieldLabel,
    companyLoginCode,
  };
}
