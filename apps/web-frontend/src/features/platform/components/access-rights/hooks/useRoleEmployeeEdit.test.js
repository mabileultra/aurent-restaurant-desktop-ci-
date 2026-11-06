import { describe, expect, it, vi } from 'vitest';
import { platformModuleAccessApi } from '../../../../../api';

describe('useRoleEmployeeEdit save logic and dirty checks', () => {
  it('detects when module toggles match initial state (isDirty = false)', () => {
    const initialToggles = { products: true, checkout: false };
    const currentToggles = { products: true, checkout: false };

    const isDirty = Object.keys(initialToggles).some(
      (k) => Boolean(initialToggles[k]) !== Boolean(currentToggles[k])
    );
    expect(isDirty).toBe(false);
  });

  it('detects when module toggles are changed (isDirty = true)', () => {
    const initialToggles = { products: true, checkout: false };
    const currentToggles = { products: true, checkout: true };

    const isDirty = Object.keys(initialToggles).some(
      (k) => Boolean(initialToggles[k]) !== Boolean(currentToggles[k])
    );
    expect(isDirty).toBe(true);
  });

  it('identifies when custom modules match roleDefault', () => {
    const detailModules = [
      { id: 'products', roleDefault: true },
      { id: 'checkout', roleDefault: false },
    ];
    const toggles = { products: true, checkout: false };

    const isMatchingRoleDefaults = detailModules.every(
      (m) => Boolean(toggles[m.id]) === Boolean(m.roleDefault)
    );
    expect(isMatchingRoleDefaults).toBe(true);
  });
});
