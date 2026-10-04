import { useRoleMobileLayout } from '../../pos-mobile/hooks/useRoleMobileLayout';

const CASHIER_MOBILE_ROLES = new Set(['CASHIER', 'ADMIN', 'MANAGER']);

export function useCashierMobileLayout() {
  return useRoleMobileLayout({
    prefsKey: 'cashier',
    allowedRoles: CASHIER_MOBILE_ROLES,
  });
}
