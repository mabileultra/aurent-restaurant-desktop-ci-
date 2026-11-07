import { describe, expect, it } from 'vitest';
import {
  isNewStaffUser,
  parseUserDetailModules,
  buildFinalUserModules,
} from './staffFlowHelpers';

describe('staffFlowHelpers', () => {
  it('correctly identifies new staff created within 7 days', () => {
    const now = Date.now();
    const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

    expect(isNewStaffUser(fourDaysAgo, now)).toBe(true);
    expect(isNewStaffUser(tenDaysAgo, now)).toBe(false);
    expect(isNewStaffUser(null, now)).toBe(false);
  });

  it('parses backend array of modules with custom exceptions accurately', () => {
    const selectedUser = {
      userId: 'u-1',
      role: 'CASHIER',
      businessType: 'RESTAURANT',
      moduleAccessCustom: true,
    };

    const userDetail = {
      userId: 'u-1',
      moduleAccessCustom: true,
      modules: [
        { id: 'cashierPos', allowed: true, roleDefault: true },
        { id: 'restaurantBooking', allowed: true, roleDefault: false }, // grant
        { id: 'restaurantKitchen', allowed: false, roleDefault: true },  // deny
      ],
    };

    const { userModules, templateModules, initialOverrides } = parseUserDetailModules(
      userDetail,
      selectedUser,
      []
    );

    expect(userModules).toHaveLength(3);
    expect(templateModules.has('cashierPos')).toBe(true);
    expect(templateModules.has('restaurantKitchen')).toBe(true);
    expect(templateModules.has('restaurantBooking')).toBe(false);

    expect(initialOverrides['cashierPos']).toBe('template');
    expect(initialOverrides['restaurantBooking']).toBe('grant');
    expect(initialOverrides['restaurantKitchen']).toBe('deny');
  });

  it('builds final modules and detects when exceptions are cleared', () => {
    const userModules = [
      { id: 'cashierPos', roleDefault: true },
      { id: 'restaurantBooking', roleDefault: false },
    ];
    const templateModules = new Set(['cashierPos']);

    // Case 1: has grant exception
    const res1 = buildFinalUserModules(
      userModules,
      { restaurantBooking: 'grant' },
      templateModules
    );
    expect(res1.hasAnyException).toBe(true);
    expect(res1.finalModules.restaurantBooking).toBe(true);

    // Case 2: everything is template -> no exceptions!
    const res2 = buildFinalUserModules(
      userModules,
      { restaurantBooking: 'template', cashierPos: 'template' },
      templateModules
    );
    expect(res2.hasAnyException).toBe(false);
    expect(res2.finalModules.restaurantBooking).toBe(false);
    expect(res2.finalModules.cashierPos).toBe(true);
  });
});
