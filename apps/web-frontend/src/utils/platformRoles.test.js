import { describe, expect, it } from 'vitest';
import {
  hasGrantedPlatformModule,
  isPlatformAdminRole,
  isPlatformAnalyticsRole,
  isPlatformUser,
  isSuperAdminRole,
} from './platformRoles';

describe('platformRoles', () => {
  it('treats SUPER_ADMIN, PLATFORM_ADMIN and PLATFORM_ANALYTICS as platform users', () => {
    expect(isSuperAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isPlatformAdminRole('PLATFORM_ADMIN')).toBe(true);
    expect(isPlatformAnalyticsRole('PLATFORM_ANALYTICS')).toBe(true);
    expect(isPlatformUser('SUPER_ADMIN')).toBe(true);
    expect(isPlatformUser('PLATFORM_ADMIN')).toBe(true);
    expect(isPlatformUser('PLATFORM_ANALYTICS')).toBe(true);
    expect(isPlatformUser('ADMIN')).toBe(false);
  });

  it('gives SUPER_ADMIN every platform module and staff only grants', () => {
    expect(hasGrantedPlatformModule('SUPER_ADMIN', [], 'platformBilling')).toBe(true);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', ['platformCompanies'], 'platformCompanies')).toBe(true);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', ['platformCompanies'], 'platformBilling')).toBe(false);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', [], 'platformCompanies')).toBe(false);
    expect(hasGrantedPlatformModule('PLATFORM_ANALYTICS', ['platformAnalytics'], 'platformAnalytics')).toBe(true);
    expect(hasGrantedPlatformModule('PLATFORM_ANALYTICS', ['platformAnalytics'], 'platformBilling')).toBe(false);
    expect(hasGrantedPlatformModule('ADMIN', ['platformCompanies'], 'platformCompanies')).toBe(false);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', null, 'platformCompanies')).toBe(false);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', ['platformCompanies'], '')).toBe(false);
  });
});
