import { describe, expect, it } from 'vitest';
import { recommendCashierUiScale } from './cashierUiScaleByMonitor';
import { resolveCashierEffectiveScale } from './cashierUiScaleFactor';

describe('recommendCashierUiScale', () => {
  it('starts from ~600 with 70%', () => {
    expect(recommendCashierUiScale(560, 1280)).toBe(0.7);
    expect(recommendCashierUiScale(650, 1366)).toBe(0.75);
  });

  it('steps up through mid heights', () => {
    expect(recommendCashierUiScale(780, 1440)).toBe(0.8);
    expect(recommendCashierUiScale(900, 1440)).toBe(0.85);
    expect(recommendCashierUiScale(1000, 1920)).toBe(0.9);
  });

  it('uses 95% near Full HD and 100% on tall', () => {
    expect(recommendCashierUiScale(1120, 1920)).toBe(0.95);
    expect(recommendCashierUiScale(1300, 1920)).toBe(1);
  });

  it('narrow width lowers base slightly', () => {
    expect(recommendCashierUiScale(1300, 1280)).toBe(0.95);
  });
});

describe('resolveCashierEffectiveScale', () => {
  it('shows 100% while applying monitor base', () => {
    const r = resolveCashierEffectiveScale(1, 780, 1440);
    expect(r.percent).toBe(100);
    expect(r.scale).toBe(0.8);
  });
});
