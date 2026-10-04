import { describe, expect, it } from 'vitest';
import {
  buildRestaurantTicketBody,
  formatTicketItemLines,
} from '../../../../src/restaurant/pos/utils/buildRestaurantTicketBody';
import { EMPH_LINE_PREFIX, RECEIPT_WIDTH } from '../../../../src/restaurant/pos/utils/ticketLayout';

const t = (key, opts) => opts?.defaultValue || key;

/** Matches photo case: long money + modifier must stay one row. */
describe('formatTicketItemLines', () => {
  it('keeps name and money in one padded row', () => {
    const lines = formatTicketItemLines({
      name: 'Лагмон',
      quantity: 1,
      unitPrice: 25000,
      lineTotal: 25000,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveLength(RECEIPT_WIDTH);
    expect(lines[0]).toMatch(/Лагмон/);
    expect(lines[0]).toMatch(/1×/);
  });

  it('keeps ADRENALIN + KATTASI + money on one row', () => {
    const lines = formatTicketItemLines({
      name: 'ADRENALIN',
      quantity: 7,
      unitPrice: 18000,
      lineTotal: 126000,
      modifiers: [{ name: 'KATTASI' }],
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveLength(RECEIPT_WIDTH);
    expect(lines[0]).toContain('ADRENALIN');
    expect(lines[0]).toContain('KATTASI');
    expect(lines[0]).toMatch(/7×/);
    expect(lines[0]).toMatch(/126/);
    expect(lines[0].indexOf('KATTASI')).toBeLessThan(lines[0].indexOf('7×'));
  });

  it('puts note on a second line only', () => {
    const lines = formatTicketItemLines({
      name: 'FANTA 1.5',
      quantity: 6,
      unitPrice: 17000,
      lineTotal: 102000,
      note: 'без льда',
    });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveLength(RECEIPT_WIDTH);
    expect(lines[1]).toContain('без льда');
  });
});

describe('buildRestaurantTicketBody bill', () => {
  const baseOrder = {
    channel: 'DINE_IN',
    tableCode: '2',
    hallName: 'Asosiy zal',
    orderNo: 729,
    storeId: 1,
    subtotal: 658000,
    discountAmount: 0,
    servicePercent: 7,
    items: [
      {
        name: 'ADRENALIN', quantity: 23, unitPrice: 14000, lineTotal: 322000,
        itemStatus: 'SENT_TO_KITCHEN', taxRate: 0,
      },
      {
        name: 'ADRENALIN', quantity: 7, unitPrice: 18000, lineTotal: 126000,
        modifiers: [{ name: 'KATTASI' }],
        itemStatus: 'SENT_TO_KITCHEN', taxRate: 0,
      },
      {
        name: 'BEHAMAD', quantity: 6, unitPrice: 18000, lineTotal: 108000,
        itemStatus: 'SENT_TO_KITCHEN', taxRate: 0,
      },
      {
        name: 'FANTA 1.5', quantity: 6, unitPrice: 17000, lineTotal: 102000,
        itemStatus: 'SENT_TO_KITCHEN', taxRate: 0,
      },
      {
        name: 'SKIP', quantity: 1, unitPrice: 1000, lineTotal: 1000,
        itemStatus: 'CANCELLED', taxRate: 0,
      },
    ],
  };

  it('matches guest-bill contract from the printed check', () => {
    const lines = buildRestaurantTicketBody({
      kind: 'bill',
      order: baseOrder,
      shift: { openedAt: '2026-10-03T04:43:04.000Z' },
      waiterName: 'DILBAR',
      t,
    });
    const joined = lines.join('\n');

    expect(lines[0]).toMatch(/Asosiy zal/);
    expect(lines[0]).toMatch(/Стол 2/);
    expect(lines[0]).toContain('№729');
    expect(joined).toContain('Официант: DILBAR');
    expect(joined).toContain('Смена');

    const itemRows = lines.filter((row) => /ADRENALIN|BEHAMAD|FANTA/.test(row));
    expect(itemRows).toHaveLength(4);
    for (const row of itemRows) {
      expect(row).toHaveLength(RECEIPT_WIDTH);
      expect(row).toMatch(/\d+×/);
    }
    expect(itemRows.some((row) => row.includes('KATTASI') && row.includes('ADRENALIN'))).toBe(true);
    expect(joined).not.toContain('SKIP');

    expect(joined).toMatch(/Обслуживание 7%|Xizmat 7%/i);
    expect(joined).not.toMatch(/Без обслуживания|Xizmatisiz|withoutService/i);

    const total = lines.find((row) => String(row).startsWith(EMPH_LINE_PREFIX));
    expect(total).toBeTruthy();
    expect(total).toMatch(/ИТОГО/i);
    expect(total.slice(EMPH_LINE_PREFIX.length)).toHaveLength(RECEIPT_WIDTH);
  });

  it('uses print-job header when provided', () => {
    const lines = buildRestaurantTicketBody({
      kind: 'bill',
      header: 'VIP · Стол 2',
      order: { tableCode: '2', orderNo: 10, items: [], subtotal: 0 },
      t,
    });
    expect(lines[0]).toContain('VIP · Стол 2');
  });
});
