import { describe, expect, it } from 'vitest';
import { canOpenPlatformPath, firstPlatformPath, PLATFORM_NAV, visiblePlatformNav } from './platformNav';

describe('platformNav', () => {
  it('shows every item to SUPER_ADMIN', () => {
    const links = visiblePlatformNav('SUPER_ADMIN', () => false);
    expect(links.some((item) => item.to === '/platform/security')).toBe(true);
    expect(links.some((item) => item.to === '/platform/access')).toBe(true);
    expect(links.some((item) => item.to === '/platform/account')).toBe(false);
    expect(firstPlatformPath('SUPER_ADMIN', () => false)).toBe('/platform/companies');
  });

  it('hides security and access from PLATFORM_ADMIN and keeps granted modules', () => {
    const hasModule = (id) => id === 'platformCompanies' || id === 'platformUsers';
    const links = visiblePlatformNav('PLATFORM_ADMIN', hasModule);
    expect(links.map((item) => item.to)).toEqual(['/platform/companies', '/platform/users', '/platform/account']);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/billing')).toBe(false);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/security')).toBe(false);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', hasModule, '/platform/companies')).toBe(true);
  });

  it('falls back to account settings when operator has no grants', () => {
    expect(firstPlatformPath('PLATFORM_ADMIN', () => false)).toBe('/platform/account');
  });

  it('keeps grantable modules unique and never exposes access or security', () => {
    const grantable = PLATFORM_NAV.filter((item) => !item.superAdminOnly && !item.operatorSelf);
    const modules = grantable.map((item) => item.module);
    expect(new Set(modules).size).toBe(modules.length);
    expect(modules.every(Boolean)).toBe(true);
    expect(modules).not.toContain('platformAccess');
    expect(modules).not.toContain('platformSecurity');
    expect(PLATFORM_NAV.filter((item) => item.superAdminOnly).map((item) => item.to)).toEqual([
      '/platform/access',
      '/platform/security',
    ]);
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
    expect(canOpenPlatformPath('PLATFORM_ADMIN', () => true, '/platform/access')).toBe(false);
    expect(canOpenPlatformPath('PLATFORM_ADMIN', () => false, '/platform/account')).toBe(true);
    expect(visiblePlatformNav('SUPER_ADMIN', () => false).some((item) => item.to === '/platform/account')).toBe(false);
  });
});
