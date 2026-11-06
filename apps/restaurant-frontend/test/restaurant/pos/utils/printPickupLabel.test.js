import { describe, expect, it } from 'vitest';
import { buildPickupLabelLines } from '../../../../src/restaurant/pos/utils/printPickupLabel';
import { buildPickupTspl } from '../../../../src/restaurant/pos/utils/pickupLabelTspl';

describe('buildPickupLabelLines', () => {
  it('shows channel, first dishes and time — not a price tag', () => {
    const lines = buildPickupLabelLines({
      channel: 'TAKEAWAY',
      items: [
        { name: 'Latte', quantity: 1 },
        { name: 'Круассан', quantity: 2 },
        { name: 'Вода', quantity: 1 },
        { name: 'Лишнее', quantity: 1 },
      ],
      printedAt: '2026-10-25T10:24:00.000Z',
      t: (_key, opts) => opts.defaultValue,
    });
    expect(lines[0]).toBe('TAKEAWAY');
    expect(lines).toContain('1× Latte');
    expect(lines).toContain('2× Круассан');
    expect(lines).toContain('1× Лишнее');
    expect(lines.some((row) => /сум|price|UZS/i.test(row))).toBe(false);
  });

  it('builds a TSPL sticker with the pickup number', () => {
    const tspl = buildPickupTspl({ pickupNo: 7, lines: ['TAKEAWAY', '1× Latte'] });
    expect(tspl).toContain('"7"');
    expect(tspl).toContain('SIZE 61 mm,30 mm');
    expect(tspl).toContain('PRINT 1,1');
    expect(tspl).toContain('Latte');
  });
});
