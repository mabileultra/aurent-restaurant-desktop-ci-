import { describe, expect, it } from 'vitest';
import { resolveHasModule } from '../../src/utils/moduleAccessGate';

const defs = [
  { id: 'restaurantPos', roles: ['CASHIER'] },
  { id: 'restaurantQuickSale', roles: [] },
];

describe('resolveHasModule', () => {
  it('shows a grant-only module when the server list includes it', () => {
    expect(resolveHasModule({
      role: 'CASHIER',
      allowedModules: ['restaurantPos', 'restaurantQuickSale'],
      custom: false,
      moduleDefs: defs,
      moduleId: 'restaurantQuickSale',
    })).toBe(true);
  });

  it('keeps a grant-only module hidden when it was not granted', () => {
    expect(resolveHasModule({
      role: 'CASHIER',
      allowedModules: ['restaurantPos'],
      custom: false,
      moduleDefs: defs,
      moduleId: 'restaurantQuickSale',
    })).toBe(false);
  });
});
