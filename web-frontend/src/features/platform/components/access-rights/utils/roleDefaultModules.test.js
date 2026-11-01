import { describe, expect, it } from 'vitest';
import {
  getDefaultModulesForRole,
  getScopeForRole,
  BUSINESS_TYPE_NAMES_UZ,
  PLATFORM_MODULE_KEYS,
} from './roleDefaultModules';
import {
  buildCatalogGroups,
  resolveModuleName,
} from './accessRightsCatalogUtils';

describe('roleDefaultModules & accessRightsCatalogUtils', () => {
  it('maps all 9 business types into correct Uzbek titles', () => {
    expect(BUSINESS_TYPE_NAMES_UZ.RESTAURANT).toBe('Restoran');
    expect(BUSINESS_TYPE_NAMES_UZ.PHARMACY).toBe('Dorixona');
    expect(BUSINESS_TYPE_NAMES_UZ.GROCERY).toBe('Oziq-ovqat');
    expect(BUSINESS_TYPE_NAMES_UZ.CONSTRUCTION).toBe('Qurilish materiallari');
    expect(BUSINESS_TYPE_NAMES_UZ.CLOTHING).toBe('Kiyim-kechak');
    expect(BUSINESS_TYPE_NAMES_UZ.CANTEEN).toBe('Oshxona / bufet');
    expect(BUSINESS_TYPE_NAMES_UZ.AUTO_PARTS).toBe('Avto ehtiyot qismlari');
    expect(BUSINESS_TYPE_NAMES_UZ.UNIVERSAL).toBe('Universal');
    expect(BUSINESS_TYPE_NAMES_UZ.OTHER).toBe('Boshqa');
  });

  it('matches exact backend roleDefault and scope numbers for RESTAURANT', () => {
    const adminScope = getScopeForRole('ADMIN', 'RESTAURANT');
    const adminDefaults = getDefaultModulesForRole('ADMIN', 'RESTAURANT');
    expect(adminScope.size).toBe(59);
    expect(adminDefaults.size).toBe(56);

    const managerScope = getScopeForRole('MANAGER', 'RESTAURANT');
    const managerDefaults = getDefaultModulesForRole('MANAGER', 'RESTAURANT');
    expect(managerScope.size).toBe(59);
    expect(managerDefaults.size).toBe(47);

    const cashierScope = getScopeForRole('CASHIER', 'RESTAURANT');
    const cashierDefaults = getDefaultModulesForRole('CASHIER', 'RESTAURANT');
    expect(cashierScope.size).toBe(11);
    expect(cashierDefaults.size).toBe(7);

    const waiterScope = getScopeForRole('WAITER', 'RESTAURANT');
    const waiterDefaults = getDefaultModulesForRole('WAITER', 'RESTAURANT');
    expect(waiterScope.size).toBe(11);
    expect(waiterDefaults.size).toBe(6);
  });

  it('excludes super-admin platform modules from tenant role defaults', () => {
    const adminRestaurant = getDefaultModulesForRole('ADMIN', 'RESTAURANT');
    PLATFORM_MODULE_KEYS.forEach((platformKey) => {
      expect(adminRestaurant.has(platformKey)).toBe(false);
    });
  });

  it('translates raw module keys into pure Uzbek titles', () => {
    expect(resolveModuleName('dashboard')).toBe('Boshqaruv paneli');
    expect(resolveModuleName('aiAssistant')).toBe('AI-assistent');
    expect(resolveModuleName('restaurantFloor')).toBe('Zal va stollar');
    expect(resolveModuleName('financeDashboard')).toBe('Moliya — boshqaruv paneli');
  });

  it('filters out platform modules from catalog groups for restaurant', () => {
    const mockCatalog = [
      { id: 'dashboard', group: 'main' },
      { id: 'platformCompanies', group: 'platform' },
      { id: 'restaurantFloor', group: 'restaurant' },
    ];
    const groups = buildCatalogGroups(mockCatalog, 'RESTAURANT');
    const allModuleIds = groups.flatMap((g) => g.modules.map((m) => m.id));

    expect(allModuleIds).toContain('dashboard');
    expect(allModuleIds).toContain('restaurantFloor');
    expect(allModuleIds).not.toContain('platformCompanies');
  });
});
