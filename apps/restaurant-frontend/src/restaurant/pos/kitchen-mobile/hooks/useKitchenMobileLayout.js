import { useRoleMobileLayout } from '../../pos-mobile/hooks/useRoleMobileLayout';

const KITCHEN_MOBILE_ROLES = new Set(['COOK', 'ADMIN', 'MANAGER', 'CASHIER', 'WAITER']);

export function useKitchenMobileLayout() {
  return useRoleMobileLayout({
    prefsKey: 'kitchen',
    allowedRoles: KITCHEN_MOBILE_ROLES,
  });
}
