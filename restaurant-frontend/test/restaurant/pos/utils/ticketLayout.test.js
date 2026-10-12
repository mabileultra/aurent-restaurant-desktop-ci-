import { describe, expect, it } from 'vitest';
import {
  EMPH_LINE_PREFIX,
  RECEIPT_WIDTH,
  emphPadRow,
  emphQtyNameRow,
  isRefuseTicketTitle,
  kitchenTicketMetaLines,
  padRow,
  qtyNameRow,
} from '../../../../src/restaurant/pos/utils/ticketLayout';

describe('padRow', () => {
  it('pins right edge at fixed width', () => {
    const row = padRow('ADRENALIN', '23×14 000 = 322 000', RECEIPT_WIDTH);
    expect(row).toHaveLength(RECEIPT_WIDTH);
    expect(row.startsWith('ADRENALIN')).toBe(true);
    expect(row.trimEnd().endsWith('322 000')).toBe(true);
    expect(row).toMatch(/\s{2,}/);
  });

  it('clips long left side with ellipsis', () => {
    const row = padRow('Очень длинное название блюда для чека', '×2', 20);
    expect(row).toHaveLength(20);
    expect(row).toContain('…');
    expect(row.endsWith('×2')).toBe(true);
  });
});

describe('qtyNameRow', () => {
  it('puts name left and ×qty right for kitchen slips', () => {
    const row = qtyNameRow(2, 'BEFSHTEKIS');
    expect(row).toHaveLength(RECEIPT_WIDTH);
    expect(row.startsWith('BEFSHTEKIS')).toBe(true);
    expect(row.trimEnd().endsWith('×2')).toBe(true);
  });

  it('emphQtyNameRow marks refuse dish lines for ESC/POS', () => {
    const row = emphQtyNameRow(1, 'Айс капучино');
    expect(row.startsWith(EMPH_LINE_PREFIX)).toBe(true);
    expect(isRefuseTicketTitle('ОТКАЗ')).toBe(true);
    expect(isRefuseTicketTitle('Кухонный чек')).toBe(false);
  });
});

describe('emphPadRow', () => {
  it('prefixes emphasized total for ESC/POS', () => {
    const row = emphPadRow('TO\'LOVGA JAMI', '704 060');
    expect(row.startsWith(EMPH_LINE_PREFIX)).toBe(true);
    expect(row.slice(EMPH_LINE_PREFIX.length)).toHaveLength(RECEIPT_WIDTH);
    expect(row).toContain('704 060');
  });
});

describe('kitchenTicketMetaLines', () => {
  it('puts hall before table', () => {
    const lines = kitchenTicketMetaLines({
      order: { tableCode: '2', hallName: 'Asosiy zal', channel: 'DINE_IN' },
      waiterName: 'DILBAR',
      t: (key, opts) => opts?.defaultValue || key,
      at: '2026-10-03T04:43:04.000Z',
    });
    expect(lines[0]).toContain('Asosiy zal');
    expect(lines[0]).toContain('Стол 2');
    expect(lines[0]).not.toContain('№');
    expect(lines[1]).toBe('Официант: DILBAR');
  });

  it('prints the check number so the next order is a new №', () => {
    const lines = kitchenTicketMetaLines({
      order: { tableCode: '2', hallName: 'Asosiy zal', channel: 'DINE_IN', orderNo: 15 },
      waiterName: 'DILBAR',
      t: (key, opts) => opts?.defaultValue || key,
    });
    expect(lines[0]).toContain('Стол 2');
    expect(lines[0]).toContain('№15');
  });
});
