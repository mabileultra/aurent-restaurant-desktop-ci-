import { describe, expect, it } from 'vitest';
import { resolveHasModule } from './moduleAccessGate';

const MODULE_DEFS = [
  { id: 'dashboard', roles: ['ADMIN', 'MANAGER'] },
  { id: 'cashierPos', roles: ['CASHIER'] },
];

describe('resolveHasModule', () => {
  it('gives SUPER_ADMIN every module', () => {
    expect(resolveHasModule({ role: 'SUPER_ADMIN', moduleId: 'platformSecurity' })).toBe(true);
    expect(resolveHasModule({ role: 'SUPER_ADMIN', moduleId: 'dashboard' })).toBe(true);
  });

  it('gives PLATFORM_ADMIN only granted keys', () => {
    expect(resolveHasModule({
      role: 'PLATFORM_ADMIN',
      allowedModules: ['platformCompanies'],
      moduleId: 'platformCompanies',
    })).toBe(true);
    expect(resolveHasModule({
      role: 'PLATFORM_ADMIN',
      allowedModules: ['platformCompanies'],
      moduleId: 'platformBilling',
    })).toBe(false);
    expect(resolveHasModule({
      role: 'PLATFORM_ADMIN',
      allowedModules: [],
      moduleId: 'platformCompanies',
    })).toBe(false);
    expect(resolveHasModule({
      role: 'PLATFORM_ADMIN',
      allowedModules: null,
      moduleId: 'platformCompanies',
    })).toBe(false);
  });

  it('keeps tenant role defaults and custom lists', () => {
    expect(resolveHasModule({
      role: 'ADMIN',
      moduleDefs: MODULE_DEFS,
      moduleId: 'dashboard',
    })).toBe(true);
    expect(resolveHasModule({
      role: 'CASHIER',
      moduleDefs: MODULE_DEFS,
      moduleId: 'dashboard',
    })).toBe(false);
    expect(resolveHasModule({
      role: 'ADMIN',
      custom: true,
      allowedModules: ['products'],
      moduleDefs: MODULE_DEFS,
      moduleId: 'dashboard',
    })).toBe(false);
    expect(resolveHasModule({
      role: 'ADMIN',
      custom: true,
      allowedModules: ['dashboard'],
      moduleDefs: MODULE_DEFS,
      moduleId: 'dashboard',
    })).toBe(true);
  });

  it('rejects missing role or module', () => {
    expect(resolveHasModule({ role: 'ADMIN', moduleId: '' })).toBe(false);
    expect(resolveHasModule({ role: '', moduleId: 'dashboard' })).toBe(false);
  });
});
