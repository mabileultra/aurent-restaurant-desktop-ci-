import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/config/restaurantAppUrl', () => ({
  getRestaurantAppUrl: vi.fn(),
  isRestaurantAppSplitEnabled: vi.fn(),
}));

import { getRestaurantAppUrl } from '../../src/config/restaurantAppUrl';
import {
  isRestaurantSpaPath,
  redirectToRestaurantApp,
  maybeRedirectRestaurantLogin,
} from '../../src/utils/restaurantAppRedirect';

describe('restaurantAppRedirect', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { assign: vi.fn() },
    });
    getRestaurantAppUrl.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects restaurant spa paths', () => {
    expect(isRestaurantSpaPath('/rst/pos')).toBe(true);
    expect(isRestaurantSpaPath('/rst')).toBe(true);
    expect(isRestaurantSpaPath('/cashier/pos')).toBe(false);
  });

  it('does nothing when restaurant URL is not configured', () => {
    getRestaurantAppUrl.mockReturnValue('');
    expect(redirectToRestaurantApp('/rst/pos', { token: 't' })).toBe(false);
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('hands off session to restaurant accept URL', () => {
    getRestaurantAppUrl.mockReturnValue('https://r-aurent.uz');
    expect(redirectToRestaurantApp('/rst/pos', {
      token: 'tok',
      user: { role: 'CASHIER', id: 1 },
    })).toBe(true);

    const url = String(window.location.assign.mock.calls[0][0]);
    expect(url).toContain('https://r-aurent.uz/auth/accept');
    expect(url).toContain('next=%2Frst%2Fpos');
    expect(url).toContain('#handoff=');
  });

  it('maybeRedirect only for restaurant paths and non-platform roles', () => {
    getRestaurantAppUrl.mockReturnValue('https://r-aurent.uz');
    expect(maybeRedirectRestaurantLogin('SUPER_ADMIN', '/rst/pos', { token: 't' })).toBe(false);
    expect(maybeRedirectRestaurantLogin('CASHIER', '/cashier/pos', { token: 't' })).toBe(false);
    expect(maybeRedirectRestaurantLogin('CASHIER', '/rst/pos', { token: 't' })).toBe(true);
    expect(maybeRedirectRestaurantLogin('WAITER', '/rst/pos', { token: 't' })).toBe(true);
  });
});
