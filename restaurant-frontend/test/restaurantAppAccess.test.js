import { describe, expect, it } from 'vitest';
import { companyFitsRestaurantApp, evaluateRestaurantAppAccess } from '../src/utils/restaurantAppAccess';

describe('restaurantAppAccess', () => {
  it('allows restaurant companies', () => {
    expect(companyFitsRestaurantApp({ defaultTypeCode: 'RESTAURANT' })).toBe(true);
    expect(companyFitsRestaurantApp({
      defaultTypeCode: 'UNIVERSAL',
      types: [{ code: 'RESTAURANT' }],
    })).toBe(true);
    expect(evaluateRestaurantAppAccess({
      role: 'ADMIN',
      businessPayload: { defaultTypeCode: 'CANTEEN' },
    }).ok).toBe(true);
  });

  it('rejects pharmacy/grocery and platform', () => {
    expect(companyFitsRestaurantApp({ defaultTypeCode: 'PHARMACY' })).toBe(false);
    expect(companyFitsRestaurantApp({ defaultTypeCode: 'UNIVERSAL' })).toBe(false);
    expect(evaluateRestaurantAppAccess({
      role: 'ADMIN',
      businessPayload: { defaultTypeCode: 'PHARMACY' },
    })).toEqual({ ok: false, reason: 'not_restaurant' });
    expect(evaluateRestaurantAppAccess({
      role: 'SUPER_ADMIN',
      businessPayload: { defaultTypeCode: 'RESTAURANT' },
    })).toEqual({ ok: false, reason: 'platform' });
  });
});
