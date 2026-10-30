import { describe, expect, it } from 'vitest';
import {
  kitchenDishMainRow,
  resolveKitchenLineAmount,
  styleKitchenDishBlock,
} from '../../../../src/restaurant/pos/utils/kitchenDishLines';
import { factoryPrintProfile } from '../../../../src/restaurant/shared/printProfile/printProfileDefaults';
import { RECEIPT_WIDTH } from '../../../../src/restaurant/pos/utils/ticketLayout';

describe('kitchenDishLines', () => {
  it('resolves amount from unit × qty when lineTotal missing', () => {
    expect(resolveKitchenLineAmount({ quantity: 2, unitPrice: 25000 })).toBe(50000);
  });

  it('qty-only row when money off', () => {
    const row = kitchenDishMainRow({ name: 'Шашлык', quantity: 2, unitPrice: 45000 }, { showMoney: false });
    expect(row).toHaveLength(RECEIPT_WIDTH);
    expect(row.trimEnd().endsWith('×2')).toBe(true);
    expect(row).not.toMatch(/45/);
  });

  it('adds price when money on', () => {
    const row = kitchenDishMainRow(
      { name: 'Шашлык', quantity: 2, unitPrice: 45000, lineTotal: 90000 },
      { showMoney: true },
    );
    expect(row).toHaveLength(RECEIPT_WIDTH);
    expect(row).toMatch(/×2/);
    expect(row).toMatch(/90/);
  });

  it('styleKitchenDishBlock respects totals checkbox', () => {
    const profile = factoryPrintProfile();
    profile.slips.KITCHEN.fields.totals.on = false;
    const plain = styleKitchenDishBlock(
      [{ name: 'Шашлык', quantity: 1, unitPrice: 45000, lineTotal: 45000 }],
      profile,
      'KITCHEN',
    );
    expect(plain.join('\n')).not.toMatch(/45/);
    expect(plain.join('\n')).not.toContain('ИТОГО');

    profile.slips.KITCHEN.fields.totals.on = true;
    const withMoney = styleKitchenDishBlock(
      [{ name: 'Шашлык', quantity: 1, unitPrice: 45000, lineTotal: 45000 }],
      profile,
      'KITCHEN',
    );
    expect(withMoney.join('\n')).toMatch(/45/);
    expect(withMoney.some((line) => String(line).includes('ИТОГО'))).toBe(true);
  });
});
