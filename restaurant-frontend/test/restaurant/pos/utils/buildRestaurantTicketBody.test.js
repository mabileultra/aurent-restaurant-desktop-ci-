import { describe, expect, it } from 'vitest';
import {
  buildRestaurantTicketBody,
  formatTicketItemLines,
} from '../../../../src/restaurant/pos/utils/buildRestaurantTicketBody';

describe('formatTicketItemLines', () => {
  it('keeps short lines in one row', () => {
    const lines = formatTicketItemLines({
      name: 'Лагмон',
      quantity: 1,
      unitPrice: 25000,
      lineTotal: 25000,
    });
    expect(lines[0]).toMatch(/Лагмон/);
    expect(lines[0]).toMatch(/1×/);
    expect(lines[0]).toMatch(/25/);
    expect(lines).toHaveLength(1);
  });

  it('wraps long money lines', () => {
    const lines = formatTicketItemLines({
      name: 'Плов праздничный большой',
      quantity: 2,
      unitPrice: 250000,
      lineTotal: 500000,
    }, 32);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[0]).toContain('Плов');
  });
});

describe('buildRestaurantTicketBody bill', () => {
  it('puts VAT and totals in footer, items without VAT', () => {
    const lines = buildRestaurantTicketBody({
      kind: 'bill',
      order: {
        tableCode: '5',
        orderNo: 237,
        storeId: 1,
        subtotal: 60000,
        discountAmount: 0,
        items: [
          {
            name: 'Лагмон', quantity: 1, unitPrice: 25000, lineTotal: 25000,
            taxRate: 12, itemStatus: 'SENT_TO_KITCHEN',
          },
          {
            name: 'Жиз', quantity: 1, unitPrice: 35000, lineTotal: 35000,
            taxRate: 12, itemStatus: 'SENT_TO_KITCHEN',
          },
        ],
      },
      shift: { openedAt: '2026-10-01T03:15:00.000Z' },
      waiterName: 'Nodira',
      t: (key, opts) => opts?.defaultValue || key,
    });
    const joined = lines.join('\n');
    expect(joined).toContain('Лагмон');
    expect(joined).toContain('Официант: Nodira');
    expect(joined).toContain('Смена');
    expect(joined).toMatch(/НДС/);
    expect(joined).toMatch(/ИТОГО/i);
    expect(joined).not.toMatch(/Лагмон.*НДС/);
  });
});
