import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getScopeForRole,
  getDefaultModulesForRole,
} from './utils/roleDefaultModules';
import {
  computeNetworkStats,
  resolveBusinessTypeName,
} from './utils/accessRightsCatalogUtils';
import AccessRightsStaffCardItem from './staff/AccessRightsStaffCardItem';
import AccessRightsStaffDetailKPIs from './staff/AccessRightsStaffDetailKPIs';
import AccessRightsTriStateButton from './shared/AccessRightsTriStateButton';

globalThis.React = React;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'uz' },
  }),
}));

describe('Access Rights Audit Bug Fixes', () => {
  it('COOK scope is synchronized with backend (10 modules for RESTAURANT, 13 for UNIVERSAL)', () => {
    const restaurantCookScope = getScopeForRole('COOK', 'RESTAURANT');
    expect(restaurantCookScope.size).toBe(10);
    expect(restaurantCookScope.has('restaurantKitchen')).toBe(true);
    expect(restaurantCookScope.has('stockProducts')).toBe(false);

    const universalCookScope = getScopeForRole('COOK', 'UNIVERSAL');
    expect(universalCookScope.size).toBe(13);
    expect(universalCookScope.has('stockProducts')).toBe(false);
  });

  it('computeNetworkStats excludes UNKNOWN company type and counts only 8 registered business types', () => {
    const statsMap = new Map([
      ['RESTAURANT', { totalEmployees: 216, exceptionCount: 35 }],
      ['GROCERY', { totalEmployees: 60, exceptionCount: 3 }],
      ['PHARMACY', { totalEmployees: 20, exceptionCount: 2 }],
      ['CONSTRUCTION', { totalEmployees: 10, exceptionCount: 1 }],
      ['CLOTHING', { totalEmployees: 10, exceptionCount: 0 }],
      ['CANTEEN', { totalEmployees: 10, exceptionCount: 0 }],
      ['AUTO_PARTS', { totalEmployees: 10, exceptionCount: 0 }],
      ['UNIVERSAL', { totalEmployees: 10, exceptionCount: 0 }],
      ['UNKNOWN', { totalEmployees: 6, exceptionCount: 0 }],
      ['PLATFORM_STAFF', { totalEmployees: 2, exceptionCount: 0 }],
    ]);

    const res = computeNetworkStats(statsMap);
    expect(res.businessTypesCount).toBe(8);
    expect(res.totalEmployees).toBe(346); // 352 - 6 UNKNOWN = 346
    expect(res.exceptionEmployees).toBe(41);
  });

  it('AccessRightsStaffCardItem displays "Istisnoli" instead of fake "1 istisno" when count is unknown', () => {
    const userWithoutExactCount = {
      id: 'u-1',
      fullName: 'KASSA (AYDAR3)',
      username: 'kassa3',
      role: 'CASHIER',
      moduleAccessCustom: true,
      exceptionCount: null,
    };

    const html = renderToStaticMarkup(
      React.createElement(AccessRightsStaffCardItem, {
        user: userWithoutExactCount,
        isSelected: false,
        isChecked: false,
        onSelect: vi.fn(),
        onCheck: vi.fn(),
      })
    );

    expect(html).toContain('Istisnoli');
    expect(html).not.toContain('1 istisno');
  });

  it('AccessRightsStaffCardItem displays exact "6 istisno" when exceptionCount is 6', () => {
    const userWithSixExceptions = {
      id: 'u-2',
      fullName: 'KASSA (AYDAR3)',
      username: 'kassa3',
      role: 'CASHIER',
      moduleAccessCustom: true,
      exceptionCount: 6,
    };

    const html = renderToStaticMarkup(
      React.createElement(AccessRightsStaffCardItem, {
        user: userWithSixExceptions,
        isSelected: false,
        isChecked: false,
        onSelect: vi.fn(),
        onCheck: vi.fn(),
      })
    );

    expect(html).toContain('6 istisno');
  });

  it('AccessRightsStaffDetailKPIs renders Uzbek labels cleanly', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsStaffDetailKPIs, {
        templateCount: 10,
        addedCount: 2,
        blockedCount: 1,
        finalCount: 11,
      })
    );

    expect(html).toContain('Shablondan');
    expect(html).toContain('Qo‘shimcha ruxsat');
    expect(html).toContain('Taqiqlangan');
    expect(html).toContain('Yakuniy kirish');
    expect(html).toContain('+2');
    expect(html).toContain('−1');
  });

  it('AccessRightsTriStateButton renders 3 states in Uzbek', () => {
    const html = renderToStaticMarkup(
      React.createElement(AccessRightsTriStateButton, {
        mode: 'grant',
        onChange: vi.fn(),
      })
    );

    expect(html).toContain('Shablon');
    expect(html).toContain('Ruxsat');
    expect(html).toContain('Taqiq');
  });
});
