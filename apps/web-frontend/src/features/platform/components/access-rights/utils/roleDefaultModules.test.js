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

  it('matches restaurant admin allowlist scope/default sizes for RESTAURANT', () => {
    const adminScope = getScopeForRole('ADMIN', 'RESTAURANT');
    const adminDefaults = getDefaultModulesForRole('ADMIN', 'RESTAURANT');
    expect(adminScope.size).toBe(21);
    expect(adminDefaults.size).toBe(17);
    expect(adminScope.has('financeDashboard')).toBe(false);
    expect(adminScope.has('cashierSales')).toBe(false);
    expect(adminScope.has('restaurantFloor')).toBe(true);

    const managerScope = getScopeForRole('MANAGER', 'RESTAURANT');
    const managerDefaults = getDefaultModulesForRole('MANAGER', 'RESTAURANT');
    expect(managerScope.size).toBe(21);
    expect(managerDefaults.size).toBe(14);

    const cashierScope = getScopeForRole('CASHIER', 'RESTAURANT');
    const cashierDefaults = getDefaultModulesForRole('CASHIER', 'RESTAURANT');
    expect(cashierScope.size).toBe(10);
    expect(cashierDefaults.size).toBe(5);

    const waiterScope = getScopeForRole('WAITER', 'RESTAURANT');
    const waiterDefaults = getDefaultModulesForRole('WAITER', 'RESTAURANT');
    expect(waiterScope.size).toBe(10);
    expect(waiterDefaults.size).toBe(4);
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

  it('matches exact backend numbers for PLATFORM_ADMIN (0/12) and PLATFORM_ANALYTICS (1/1)', () => {
    expect(PLATFORM_MODULE_KEYS.size).toBe(12);
    expect(PLATFORM_MODULE_KEYS.has('super_admin')).toBe(false);

    const operatorScope = getScopeForRole('PLATFORM_ADMIN', 'PLATFORM_STAFF');
    const operatorDefaults = getDefaultModulesForRole('PLATFORM_ADMIN', 'PLATFORM_STAFF');
    expect(operatorScope.size).toBe(12);
    expect(operatorDefaults.size).toBe(0);

    const analystScope = getScopeForRole('PLATFORM_ANALYTICS', 'PLATFORM_STAFF');
    const analystDefaults = getDefaultModulesForRole('PLATFORM_ANALYTICS', 'PLATFORM_STAFF');
    expect(analystScope.size).toBe(1);
    expect(analystScope.has('platformAnalytics')).toBe(true);
    expect(analystDefaults.size).toBe(1);
    expect(analystDefaults.has('platformAnalytics')).toBe(true);
  });

  it('translates platform modules into clean Uzbek and Russian titles', () => {
    expect(resolveModuleName('platformCompanies', {}, 'uz')).toBe('Kompaniyalar');
    expect(resolveModuleName('platformCompanies', {}, 'ru')).toBe('Компании');
    expect(resolveModuleName('platformAnalytics', {}, 'uz')).toBe('Platforma analitikasi');
    expect(resolveModuleName('platformBilling', {}, 'uz')).toBe('Billing va to‘lovlar');
  });

  it('filters catalog groups by allowedModuleIds when provided', () => {
    const mockCatalog = [
      { id: 'dashboard', group: 'main' },
      { id: 'restaurantPos', group: 'cashier' },
      { id: 'products', group: 'goods' },
    ];
    const allowed = new Set(['restaurantPos']);
    const groups = buildCatalogGroups(mockCatalog, 'RESTAURANT', 'uz', allowed);
    expect(groups.length).toBe(1);
    expect(groups[0].modules.length).toBe(1);
    expect(groups[0].modules[0].id).toBe('restaurantPos');
  });
});
