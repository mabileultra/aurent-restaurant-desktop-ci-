import { describe, expect, it } from 'vitest';
import {
  hasGrantedPlatformModule,
  isPlatformAdminRole,
  isPlatformUser,
  isSuperAdminRole,
} from './platformRoles';

describe('platformRoles', () => {
  it('treats SUPER_ADMIN and PLATFORM_ADMIN as platform users', () => {
    expect(isSuperAdminRole('SUPER_ADMIN')).toBe(true);
    expect(isPlatformAdminRole('PLATFORM_ADMIN')).toBe(true);
    expect(isPlatformUser('SUPER_ADMIN')).toBe(true);
    expect(isPlatformUser('PLATFORM_ADMIN')).toBe(true);
    expect(isPlatformUser('ADMIN')).toBe(false);
  });

  it('gives SUPER_ADMIN every platform module and PLATFORM_ADMIN only grants', () => {
    expect(hasGrantedPlatformModule('SUPER_ADMIN', [], 'platformBilling')).toBe(true);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', ['platformCompanies'], 'platformCompanies')).toBe(true);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', ['platformCompanies'], 'platformBilling')).toBe(false);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', [], 'platformCompanies')).toBe(false);
    expect(hasGrantedPlatformModule('ADMIN', ['platformCompanies'], 'platformCompanies')).toBe(false);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', null, 'platformCompanies')).toBe(false);
    expect(hasGrantedPlatformModule('PLATFORM_ADMIN', ['platformCompanies'], '')).toBe(false);
  });
});
