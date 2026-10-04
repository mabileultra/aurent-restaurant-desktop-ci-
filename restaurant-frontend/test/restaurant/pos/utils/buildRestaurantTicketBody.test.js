import { describe, expect, it } from 'vitest';
import {
  buildRestaurantTicketBody,
  formatTicketItemLines,
} from '../../../../src/restaurant/pos/utils/buildRestaurantTicketBody';
import { EMPH_LINE_PREFIX } from '../../../../src/restaurant/pos/utils/ticketLayout';

describe('formatTicketItemLines', () => {
  it('keeps name and money in one padded row', () => {
    const lines = formatTicketItemLines({
      name: 'Лагмон',
      quantity: 1,
      unitPrice: 25000,
      lineTotal: 25000,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/Лагмон/);
    expect(lines[0]).toMatch(/1×/);
    expect(lines[0]).toMatch(/25/);
    expect(lines[0]).toMatch(/\s{2,}/);
  });

  it('folds modifiers into the same row', () => {
    const lines = formatTicketItemLines({
      name: 'ADRENALIN',
      quantity: 7,
      unitPrice: 18000,
      lineTotal: 126000,
      modifiers: [{ name: 'KATTASI' }],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('ADRENALIN');
    expect(lines[0]).toContain('KATTASI');
    expect(lines[0]).toMatch(/7×/);
  });
});

describe('buildRestaurantTicketBody bill', () => {
  it('puts hall before table, skips without-service, emphasizes total', () => {
    const lines = buildRestaurantTicketBody({
      kind: 'bill',
      order: {
        channel: 'DINE_IN',
        tableCode: '2',
        hallName: 'Asosiy zal',
        orderNo: 729,
        storeId: 1,
        subtotal: 60000,
        discountAmount: 0,
        servicePercent: 7,
        serviceAmount: 4200,
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
    expect(joined).toContain('Asosiy zal');
    expect(joined).toContain('Стол 2');
    expect(joined).toContain('Официант: Nodira');
    expect(joined).toContain('Смена');
    expect(joined).toMatch(/НДС/);
    expect(joined).toMatch(/ИТОГО/i);
    expect(joined).not.toMatch(/Без обслуживания|Xizmatisiz|withoutService/i);
    expect(lines.some((row) => String(row).startsWith(EMPH_LINE_PREFIX))).toBe(true);
  });

  it('uses print-job header when provided', () => {
    const lines = buildRestaurantTicketBody({
      kind: 'bill',
      header: 'VIP · Стол 2',
      order: {
        tableCode: '2',
        orderNo: 10,
        items: [],
        subtotal: 0,
      },
      t: (key, opts) => opts?.defaultValue || key,
    });
    expect(lines[0]).toContain('VIP · Стол 2');
  });
});
