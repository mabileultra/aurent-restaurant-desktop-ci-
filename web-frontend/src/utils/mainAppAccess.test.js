import { describe, expect, it } from 'vitest';
import { companyFitsMainApp, evaluateMainAppAccess } from './mainAppAccess';

describe('mainAppAccess', () => {
  it('allows pharmacy and grocery companies', () => {
    expect(companyFitsMainApp({ defaultTypeCode: 'PHARMACY' })).toBe(true);
    expect(companyFitsMainApp({ defaultTypeCode: 'UNIVERSAL' })).toBe(true);
    expect(evaluateMainAppAccess({
      role: 'ADMIN',
      businessPayload: { defaultTypeCode: 'PHARMACY' },
    }).ok).toBe(true);
  });

  it('rejects restaurant-only companies and floor roles', () => {
    expect(companyFitsMainApp({ defaultTypeCode: 'RESTAURANT' })).toBe(false);
    expect(companyFitsMainApp({
      defaultTypeCode: 'RESTAURANT',
      types: [{ code: 'RESTAURANT' }, { code: 'CANTEEN' }],
    })).toBe(false);
    expect(companyFitsMainApp(null)).toBe(null);
    expect(evaluateMainAppAccess({
      role: 'WAITER',
      businessPayload: { defaultTypeCode: 'UNIVERSAL' },
    })).toEqual({ ok: false, reason: 'restaurant_role' });
    expect(evaluateMainAppAccess({
      role: 'ADMIN',
      businessPayload: { defaultTypeCode: 'RESTAURANT' },
    })).toEqual({ ok: false, reason: 'restaurant_only' });
    expect(evaluateMainAppAccess({
      role: 'ADMIN',
      businessPayload: null,
    })).toEqual({ ok: false, reason: 'unknown' });
  });

  it('allows mixed companies on main', () => {
    expect(companyFitsMainApp({
      defaultTypeCode: 'RESTAURANT',
      types: [{ code: 'RESTAURANT' }, { code: 'PHARMACY' }],
    })).toBe(true);
  });

  it('allows platform users', () => {
    expect(evaluateMainAppAccess({
      role: 'SUPER_ADMIN',
      businessPayload: { defaultTypeCode: 'RESTAURANT' },
    }).ok).toBe(true);
    expect(evaluateMainAppAccess({
      role: 'SUPER_ADMIN',
      businessPayload: null,
    }).ok).toBe(true);
  });
});
