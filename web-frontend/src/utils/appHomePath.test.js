import { describe, expect, it } from 'vitest';
import { resolveAppHomePath } from './appHomePath';

describe('resolveAppHomePath', () => {
  it('sends both platform roles to super-admin shell', () => {
    expect(resolveAppHomePath('SUPER_ADMIN')).toBe('/platform');
    expect(resolveAppHomePath('PLATFORM_ADMIN')).toBe('/platform');
    expect(resolveAppHomePath('PLATFORM_ADMIN', 'PHARMACY')).toBe('/platform');
  });

  it('does not send tenant roles to platform', () => {
    expect(resolveAppHomePath('ADMIN')).toBe('/dashboard');
    expect(resolveAppHomePath('MANAGER')).toBe('/dashboard');
    expect(resolveAppHomePath('CASHIER')).toBe('/cashier/pos');
  });
});
