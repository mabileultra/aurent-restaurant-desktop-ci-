import { describe, expect, it } from 'vitest';
import { isRestaurantLocalFirstKilled } from '../../../src/services/offline/restaurantLocalFirstKillSwitch';
import { isRestaurantLocalFirstOn } from '../../../src/services/offline/restaurantOfflineBridge';
import { isWaiterPwaLocalFirstEligible } from '../../../src/services/offline/waiterPwa/bridge';

describe('restaurant local-first kill switch', () => {
  it('is armed for production clients', () => {
    expect(isRestaurantLocalFirstKilled()).toBe(true);
  });

  it('forces FE local-first off', () => {
    expect(isRestaurantLocalFirstOn()).toBe(false);
  });

  it('blocks waiter PWA offline path', () => {
    expect(isWaiterPwaLocalFirstEligible()).toBe(false);
  });
});
