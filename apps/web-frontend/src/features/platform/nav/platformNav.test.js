import { describe, expect, it } from 'vitest';
import { canOpenPlatformPath, firstPlatformPath, PLATFORM_NAV, visiblePlatformNav, visiblePlatformNavGrouped } from './platformNav';

describe('platformNav', () => {
  it('shows every item to SUPER_ADMIN', () => {
    const links = visiblePlatformNav('SUPER_ADMIN', () => false);
    expect(links.some((item) => item.to === '/platform/security')).toBe(true);
    expect(links.some((item) => item.to === '/platform/access')).toBe(true);
    expect(links.some((item) => item.to === '/platform/account')).toBe(false);
    expect(firstPlatformPath('SUPER_ADMIN', () => false)).toBe('/platform/companies');
  });

  it('hides security from PLATFORM_ADMIN and keeps granted modules including access', () => {
    const hasModule = (id) => id === 'platformCompanies' || id === 'platformUsers' || id === 'platformAccess';
    const links = visiblePlatformNav('PLATFORM_ADMIN', hasModule);
    expect(links.map((item) => item.to)).toEqual([
      '/platform/companies',
      '/platform/users',
      '/platform/access',
      '/platform/account',
    ]);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/billing')).toBe(false);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/security')).toBe(false);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/access')).toBe(true);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/companies')).toBe(true);
  });

  it('falls back to account settings when operator has no grants', () => {
    expect(firstPlatformPath('PLATFORM_ADMIN', () => false)).toBe('/platform/account');
  });

  it('keeps grantable modules unique and never exposes security', () => {
    const grantable = PLATFORM_NAV.filter((item) => !item.superAdminOnly && !item.operatorSelf);
    const modules = grantable.map((item) => item.module);
    expect(new Set(modules).size).toBe(modules.length);
    expect(modules.every(Boolean)).toBe(true);
    expect(modules).toContain('platformAccess');
    expect(modules).toContain('platformAnalytics');
    expect(modules).not.toContain('platformSecurity');
    expect(PLATFORM_NAV.filter((item) => item.superAdminOnly).map((item) => item.to)).toEqual([
      '/platform/security',
    ]);
  });

  it('shows analytics without nested tabs to SUPER_ADMIN', () => {
    const links = visiblePlatformNav('SUPER_ADMIN', () => false);
    const analytics = links.find((item) => item.to === '/platform/analytics');
    expect(analytics?.children).toBeUndefined();
    expect(canOpenPlatformPath('SUPER_ADMIN', () => false, '/platform/analytics')).toBe(true);
  });

  it('shows only analytics and account to PLATFORM_ANALYTICS', () => {
    const hasModule = (id) => id === 'platformAnalytics';
    const links = visiblePlatformNav('PLATFORM_ANALYTICS', hasModule);
    expect(links.map((item) => item.to)).toEqual(['/platform/analytics', '/platform/account']);
    expect(canOpenPlatformPath('PLATFORM_ANALYTICS', hasModule, '/platform/analytics')).toBe(true);
    expect(canOpenPlatformPath('PLATFORM_ANALYTICS', hasModule, '/platform/billing')).toBe(false);
    expect(canOpenPlatformPath('PLATFORM_ANALYTICS', hasModule, '/platform/security')).toBe(false);
    expect(firstPlatformPath('PLATFORM_ANALYTICS', hasModule)).toBe('/platform/analytics');
  });

  it('blocks nested paths of ungranted sections', () => {
    const hasModule = (id) => id === 'platformStores';
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/stores/12')).toBe(true);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/users')).toBe(false);
    expect(canOpenPlatformPath('ADMIN', hasModule, '/platform/stores')).toBe(false);
  });

  it('hides the whole platform nav from tenant roles', () => {
    expect(visiblePlatformNav('ADMIN', () => true)).toEqual([]);
    expect(visiblePlatformNav('MANAGER', () => true)).toEqual([]);
    expect(canOpenPlatformPath('SUPER_ADMIN', () => false, '/platform/security')).toBe(true);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', (id) => id === 'platformAccess', '/platform/access')).toBe(true);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', () => false, '/platform/access')).toBe(false);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', () => false, '/platform/account')).toBe(true);
    expect(visiblePlatformNav('SUPER_ADMIN', () => false).some((item) => item.to === '/platform/account')).toBe(false);
  });

  it('groups visible navigation items correctly for accordion', () => {
    const groups = visiblePlatformNavGrouped('SUPER_ADMIN', () => false);
    expect(groups.map((g) => g.id)).toEqual(['main', 'finance', 'management']);

    const mainGroup = groups.find((g) => g.id === 'main');
    expect(mainGroup.items.map((i) => i.to)).toEqual([
      '/platform/companies',
      '/platform/stores',
      '/platform/users',
    ]);

    const financeGroup = groups.find((g) => g.id === 'finance');
    expect(financeGroup.items.map((i) => i.to)).toEqual([
      '/platform/billing',
      '/platform/desktop-notifications',
      '/platform/analytics',
    ]);

    const managementGroup = groups.find((g) => g.id === 'management');
    expect(managementGroup.items.map((i) => i.to)).toEqual([
      '/platform/access',
      '/platform/business-types',
      '/platform/reference-books',
      '/platform/leads',
      '/platform/monitoring',
      '/platform/email',
      '/platform/security',
    ]);
  });

  it('omits empty groups when operator has access to a single module', () => {
    // Only platformAnalytics granted to PLATFORM_ANALYTICS
    const hasModule = (id) => id === 'platformAnalytics';
    const groups = visiblePlatformNavGrouped('PLATFORM_ANALYTICS', hasModule);
    expect(groups.map((g) => g.id)).toEqual(['finance', 'management']);
    expect(groups.find((g) => g.id === 'main')).toBeUndefined();
    expect(groups.find((g) => g.id === 'finance').items.map((i) => i.to)).toEqual(['/platform/analytics']);
    expect(groups.find((g) => g.id === 'management').items.map((i) => i.to)).toEqual(['/platform/account']);
  });

  it('omits all groups for tenant roles', () => {
    expect(visiblePlatformNavGrouped('ADMIN', () => true)).toEqual([]);
    expect(visiblePlatformNavGrouped('MANAGER', () => true)).toEqual([]);
    expect(visiblePlatformNavGrouped('CASHIER', () => true)).toEqual([]);
  });
});
