import { isPlatformAdminRole, isSuperAdminRole } from '../../../utils/platformRoles';

export const PLATFORM_NAV = [
  { to: '/platform/companies', key: 'platform.companies', module: 'platformCompanies' },
  { to: '/platform/stores', key: 'platform.stores', module: 'platformStores' },
  { to: '/platform/users', key: 'platform.users', module: 'platformUsers' },
  { to: '/platform/access', key: 'platform.moduleAccess.nav', module: 'platformAccess' },
  { to: '/platform/business-types', key: 'platform.businessTypes.nav', module: 'platformBusinessTypes' },
  { to: '/platform/reference-books', key: 'platform.referenceBooks.nav', module: 'platformReferenceBooks' },
  { to: '/platform/leads', key: 'platform.leads.nav', module: 'platformLeads' },
  { to: '/platform/billing', key: 'platform.billing.nav', module: 'platformBilling' },
  { to: '/platform/monitoring', key: 'platform.monitoring.nav', module: 'platformMonitoring' },
  { to: '/platform/email', key: 'platform.email.nav', module: 'platformEmail' },
  { to: '/platform/desktop-notifications', key: 'platform.desktopNotifications.nav', module: 'platformDesktopNotifications' },
  { to: '/platform/security', key: 'platform.security.nav', superAdminOnly: true },
  { to: '/platform/account', key: 'platform.account.nav', operatorSelf: true },
];

export function visiblePlatformNav(role, hasModule) {
  if (isSuperAdminRole(role)) {
    return PLATFORM_NAV.filter((item) => !item.operatorSelf);
  }
  if (!isPlatformAdminRole(role)) return [];
  return PLATFORM_NAV.filter((item) => {
    if (item.operatorSelf) return true;
    return !item.superAdminOnly && hasModule(item.module);
  });
}

export function firstPlatformPath(role, hasModule) {
  return visiblePlatformNav(role, hasModule)[0]?.to ?? '/platform';
}

export function canOpenPlatformPath(role, hasModule, pathname) {
  if (isSuperAdminRole(role)) return true;
  if (!isPlatformAdminRole(role)) return false;
  const item = PLATFORM_NAV.find((row) => pathname === row.to || pathname.startsWith(`${row.to}/`));
  if (!item) return true;
  if (item.operatorSelf) return true;
  if (item.superAdminOnly) return false;
  return hasModule(item.module);
}
