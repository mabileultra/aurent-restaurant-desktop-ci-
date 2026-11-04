import { isPlatformAdminRole, isPlatformAnalyticsRole, isSuperAdminRole } from '../../../utils/platformRoles';

export const PLATFORM_NAV_GROUPS = [
  { id: 'main', key: 'platform.navGroups.main' },
  { id: 'finance', key: 'platform.navGroups.finance' },
  { id: 'management', key: 'platform.navGroups.management' },
];

export const PLATFORM_NAV = [
  // Asosiy
  { to: '/platform/companies', key: 'platform.companies', module: 'platformCompanies', group: 'main' },
  { to: '/platform/stores', key: 'platform.stores', module: 'platformStores', group: 'main' },
  { to: '/platform/users', key: 'platform.users', module: 'platformUsers', group: 'main' },

  // Moliya va hisob
  { to: '/platform/billing', key: 'platform.billing.nav', module: 'platformBilling', group: 'finance' },
  { to: '/platform/desktop-notifications', key: 'platform.desktopNotifications.nav', module: 'platformDesktopNotifications', group: 'finance' },
  { to: '/platform/analytics', key: 'platform.analytics.nav', module: 'platformAnalytics', group: 'finance' },

  // Boshqaruv
  { to: '/platform/access', key: 'platform.moduleAccess.nav', module: 'platformAccess', group: 'management' },
  { to: '/platform/business-types', key: 'platform.businessTypes.nav', module: 'platformBusinessTypes', group: 'management' },
  { to: '/platform/reference-books', key: 'platform.referenceBooks.nav', module: 'platformReferenceBooks', group: 'management' },
  { to: '/platform/leads', key: 'platform.leads.nav', module: 'platformLeads', group: 'management' },
  { to: '/platform/monitoring', key: 'platform.monitoring.nav', module: 'platformMonitoring', group: 'management' },
  { to: '/platform/email', key: 'platform.email.nav', module: 'platformEmail', group: 'management' },
  { to: '/platform/security', key: 'platform.security.nav', superAdminOnly: true, group: 'management' },
  { to: '/platform/account', key: 'platform.account.nav', operatorSelf: true, group: 'management' },
];

function isPlatformStaffNavRole(role) {
  return isPlatformAdminRole(role) || isPlatformAnalyticsRole(role);
}

export function visiblePlatformNav(role, hasModule) {
  if (isSuperAdminRole(role)) {
    return PLATFORM_NAV.filter((item) => !item.operatorSelf);
  }
  if (!isPlatformStaffNavRole(role)) return [];
  return PLATFORM_NAV.filter((item) => {
    if (item.operatorSelf) return true;
    return !item.superAdminOnly && hasModule(item.module);
  });
}

export function visiblePlatformNavGrouped(role, hasModule) {
  const visible = visiblePlatformNav(role, hasModule);
  return PLATFORM_NAV_GROUPS.map((group) => ({
    ...group,
    items: visible.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);
}

export function firstPlatformPath(role, hasModule) {
  return visiblePlatformNav(role, hasModule)[0]?.to ?? '/platform';
}

export function canOpenPlatformPath(role, hasModule, pathname) {
  if (isSuperAdminRole(role)) return true;
  if (!isPlatformStaffNavRole(role)) return false;
  const item = PLATFORM_NAV.find((row) => pathname === row.to || pathname.startsWith(`${row.to}/`));
  if (!item) return true;
  if (item.operatorSelf) return true;
  if (item.superAdminOnly) return false;
  return hasModule(item.module);
}

