import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyRestaurantDesktopCompanyCode } from '../src/features/cashier/utils/applyRestaurantDesktopCompanyCode';

vi.mock('../src/utils/restaurantDesktop', () => ({
  isRestaurantDesktop: () => true,
}));

vi.mock('../src/utils/authLogin', async () => {
  const actual = await vi.importActual('../src/utils/authLogin');
  return {
    ...actual,
    persistCompanyLoginCode: vi.fn(),
  };
});

describe('applyRestaurantDesktopCompanyCode', () => {
  beforeEach(() => {
    const api = {
      getCompanyLoginCode: vi.fn(async () => '97125'),
      getEdgeAuthStatus: vi.fn(async () => ({ hasStaff: true, boundCompanyLoginCode: '97125' })),
      setCompanyLoginCode: vi.fn(async (c) => c),
      resetEdgeTenant: vi.fn(async () => ({ ok: true })),
    };
    globalThis.window = {
      aurentRestaurant: api,
      confirm: vi.fn(() => true),
    };
  });

  it('resets edge when company code changes and local staff exists', async () => {
    const result = await applyRestaurantDesktopCompanyCode('11200', {
      t: (_k, opts) => opts.defaultValue,
    });
    expect(result).toEqual({ ok: true, reset: true, companyLoginCode: '11200' });
    expect(window.aurentRestaurant.resetEdgeTenant).toHaveBeenCalledWith({
      companyLoginCode: '11200',
    });
  });

  it('skips wipe when code unchanged', async () => {
    const result = await applyRestaurantDesktopCompanyCode('97125', {
      t: (_k, opts) => opts.defaultValue,
    });
    expect(result.reset).toBe(false);
    expect(window.aurentRestaurant.resetEdgeTenant).not.toHaveBeenCalled();
  });

  it('reverts when user cancels confirm', async () => {
    window.confirm = vi.fn(() => false);
    const result = await applyRestaurantDesktopCompanyCode('11200', {
      t: (_k, opts) => opts.defaultValue,
    });
    expect(result).toEqual({ ok: false, reason: 'cancelled', revertTo: '97125' });
    expect(window.aurentRestaurant.resetEdgeTenant).not.toHaveBeenCalled();
  });
});
