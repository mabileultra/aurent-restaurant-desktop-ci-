import { describe, expect, it } from 'vitest';
import {
  formatCompact,
  formatNumber,
  formatPercent,
  calculateDonutArc,
  prepareProductsList,
  parseDayLabels,
  prepareDayChips,
  filterDayReceipts,
  prepareReceiptDetail,
} from './korxonaDetailUtils';

describe('korxonaDetailUtils', () => {
  it('formats numbers and percentages properly', () => {
    expect(formatCompact(512439000)).toBe('512,4 mln');
    expect(formatNumber(1200000)).toBe('1 200 000');
    expect(formatPercent(99.2)).toBe('99,2%');
    expect(formatPercent(null)).toBe('—');
  });

  it('calculates donut dash arc', () => {
    const arc = calculateDonutArc(50);
    expect(arc).toContain('138.2 276.5');
  });

  it('prepares and sorts products list', () => {
    const raw = [
      ['Phone A', 2, 20000000],
      ['Phone B', 5, 10000000],
    ];
    const bySum = prepareProductsList(raw, 'sum');
    expect(bySum.products[0].name).toBe('Phone A');

    const byQty = prepareProductsList(raw, 'qty');
    expect(byQty.products[0].name).toBe('Phone B');
  });

  it('paginates products list by 10 items with correct rank and bounds', () => {
    const raw25 = Array.from({ length: 25 }, (_, i) => [`Tovar ${i + 1}`, 10, (25 - i) * 1000]);

    // Page 0 (items 1..10)
    const page0 = prepareProductsList(raw25, 'sum', 0, 10);
    expect(page0.totalCount).toBe(25);
    expect(page0.totalPages).toBe(3);
    expect(page0.from).toBe(1);
    expect(page0.to).toBe(10);
    expect(page0.products).toHaveLength(10);
    expect(page0.products[0].rank).toBe(1);
    expect(page0.products[0].name).toBe('Tovar 1');

    // Page 1 (items 11..20)
    const page1 = prepareProductsList(raw25, 'sum', 1, 10);
    expect(page1.from).toBe(11);
    expect(page1.to).toBe(20);
    expect(page1.products).toHaveLength(10);
    expect(page1.products[0].rank).toBe(11);
    expect(page1.products[0].name).toBe('Tovar 11');

    // Page 2 (items 21..25)
    const page2 = prepareProductsList(raw25, 'sum', 2, 10);
    expect(page2.from).toBe(21);
    expect(page2.to).toBe(25);
    expect(page2.products).toHaveLength(5);
    expect(page2.products[0].rank).toBe(21);
    expect(page2.products[0].name).toBe('Tovar 21');
  });

  it('parses day labels', () => {
    const { short, long } = parseDayLabels('2026-10-28');
    expect(short).toBe('28-okt');
    expect(long).toBe('28-oktabr, 2026');
  });

  it('filters day receipts and generates details', () => {
    const receipts = [
      ['RCP-1', '2026-10-28', '12:00', 1000, 100, 1100, 'CASH', 1, 'SIGN1', '01', [['Item 1', 1, 1100]]],
      ['RCP-2', '2026-10-28', '13:00', 2000, 200, 2200, 'CASHLESS', 0, null, null, [['Item 2', 2, 1100]]],
    ];

    const chips = prepareDayChips(receipts);
    expect(chips).toHaveLength(1);
    expect(chips[0].hasPending).toBe(true);

    const fRes = filterDayReceipts(receipts, '2026-10-28', 'f');
    expect(fRes.rows).toHaveLength(1);
    expect(fRes.totalFiscal).toBe(1);
    expect(fRes.totalNonFiscal).toBe(1);

    const detail = prepareReceiptDetail(receipts[0]);
    expect(detail.no).toBe('RCP-1');
    expect(detail.isFiscal).toBe(true);
    expect(detail.payMethod).toBe('Naqd pul');
  });
});
