import { describe, expect, it } from 'vitest';
import {
  getDefaultModulesForRole,
  BUSINESS_TYPE_NAMES_UZ,
  PLATFORM_MODULE_KEYS,
} from './roleDefaultModules';
import {
  buildCatalogGroups,
  resolveModuleName,
  MODULE_NAMES_UZ,
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

  it('excludes super-admin platform modules from tenant role defaults', () => {
    const adminRestaurant = getDefaultModulesForRole('ADMIN', 'RESTAURANT');
    PLATFORM_MODULE_KEYS.forEach((platformKey) => {
      expect(adminRestaurant.has(platformKey)).toBe(false);
    });
  });

  it('correctly grants default modules for MANAGER in RESTAURANT', () => {
    const managerRestaurant = getDefaultModulesForRole('MANAGER', 'RESTAURANT');
    expect(managerRestaurant.has('dashboard')).toBe(true);
    expect(managerRestaurant.has('restaurantFloor')).toBe(true);
    expect(managerRestaurant.has('restaurantKitchen')).toBe(true);
    expect(managerRestaurant.has('financeIncomes')).toBe(true);
    expect(managerRestaurant.has('aiAssistant')).toBe(false);
    expect(managerRestaurant.has('usersList')).toBe(false);
  });

  it('correctly grants default modules for CASHIER', () => {
    const cashierRestaurant = getDefaultModulesForRole('CASHIER', 'RESTAURANT');
    expect(cashierRestaurant.has('restaurantPos')).toBe(true);
    expect(cashierRestaurant.has('cashierPos')).toBe(false);
    expect(cashierRestaurant.has('restaurantKitchen')).toBe(true);
    expect(cashierRestaurant.has('dashboard')).toBe(false);

    const cashierGrocery = getDefaultModulesForRole('CASHIER', 'GROCERY');
    expect(cashierGrocery.has('cashierPos')).toBe(true);
    expect(cashierGrocery.has('restaurantPos')).toBe(false);
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
