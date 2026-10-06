import { isPlatformAdminRole, isPlatformAnalyticsRole, isSuperAdminRole } from '../../../utils/platformRoles';

export const PLATFORM_ANALYTICS_TABS = [
  { to: '/platform/analytics', key: 'platform.analytics.tabs.overview', end: true },
  { to: '/platform/analytics/stores', key: 'platform.analytics.tabs.stores' },
  { to: '/platform/analytics/products', key: 'platform.analytics.tabs.products' },
  { to: '/platform/analytics/sales', key: 'platform.analytics.tabs.sales' },
  { to: '/platform/analytics/fiscal', key: 'platform.analytics.tabs.fiscal' },
  { to: '/platform/analytics/payments', key: 'platform.analytics.tabs.payments' },
  { to: '/platform/analytics/customers', key: 'platform.analytics.tabs.customers' },
  { to: '/platform/analytics/geography', key: 'platform.analytics.tabs.geography' },
  { to: '/platform/analytics/anomalies', key: 'platform.analytics.tabs.anomalies' },
];

export const PLATFORM_NAV = [
  { to: '/platform/companies', key: 'platform.companies', module: 'platformCompanies' },
  { to: '/platform/stores', key: 'platform.stores', module: 'platformStores' },
  { to: '/platform/users', key: 'platform.users', module: 'platformUsers' },
  { to: '/platform/access', key: 'platform.moduleAccess.nav', module: 'platformAccess' },
  { to: '/platform/business-types', key: 'platform.businessTypes.nav', module: 'platformBusinessTypes' },
  { to: '/platform/reference-books', key: 'platform.referenceBooks.nav', module: 'platformReferenceBooks' },
  { to: '/platform/leads', key: 'platform.leads.nav', module: 'platformLeads' },
  { to: '/platform/billing', key: 'platform.billing.nav', module: 'platformBilling' },
  {
    to: '/platform/analytics',
    key: 'platform.analytics.nav',
    module: 'platformAnalytics',
    children: PLATFORM_ANALYTICS_TABS,
  },
  { to: '/platform/monitoring', key: 'platform.monitoring.nav', module: 'platformMonitoring' },
  { to: '/platform/email', key: 'platform.email.nav', module: 'platformEmail' },
  { to: '/platform/desktop-notifications', key: 'platform.desktopNotifications.nav', module: 'platformDesktopNotifications' },
  { to: '/platform/security', key: 'platform.security.nav', superAdminOnly: true },
  { to: '/platform/account', key: 'platform.account.nav', operatorSelf: true },
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
