import { describe, expect, it } from 'vitest';
import { resolveRestaurantPickableStores } from '../src/restaurant/shared/utils/resolveRestaurantPickableStores';

describe('resolveRestaurantPickableStores', () => {
  it('prefers staff pool for floor roles', () => {
    const staffPool = [{ id: 2, name: 'Hall A', businessType: 'RESTAURANT' }];
    expect(resolveRestaurantPickableStores({
      restaurantStores: [{ id: 9, name: 'Other' }],
      assignedIds: [2],
      staffUsesAssignment: true,
      staffPool,
    })).toEqual(staffPool);
  });

  it('uses company restaurant list for admin when present', () => {
    const restaurants = [{ id: 3, name: 'Cafe', businessType: 'RESTAURANT' }];
    expect(resolveRestaurantPickableStores({
      restaurantStores: restaurants,
      assignedIds: [3, 8],
      staffUsesAssignment: false,
      staffPool: [],
    })).toEqual(restaurants);
  });

  it('synthesizes from JWT storeIds when /stores empty offline', () => {
    expect(resolveRestaurantPickableStores({
      restaurantStores: [],
      assignedIds: [11, 12],
      staffUsesAssignment: false,
      staffPool: [],
    })).toEqual([
      { id: 11, name: 'Точка #11', businessType: 'RESTAURANT', active: true },
      { id: 12, name: 'Точка #12', businessType: 'RESTAURANT', active: true },
    ]);
  });
});
