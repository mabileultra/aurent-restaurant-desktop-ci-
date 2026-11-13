import { describe, expect, it } from 'vitest';
import {
  formatCompact,
  formatPercent,
  calculateRingDash,
  calculateDeltaBadge,
  calculateDistrictsBreakdown,
  filterAndPaginateCompanies,
  formatCompanyRows,
} from './viloyatDetailUtils';

describe('viloyatDetailUtils', () => {
  it('formats compact numbers properly', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(4705580191)).toBe('4,71 mlrd');
    expect(formatCompact(1263100420)).toBe('1,26 mlrd');
    expect(formatCompact(135219200)).toBe('135,2 mln');
    expect(formatCompact(450000)).toBe('450 ming');
    expect(formatCompact(500)).toBe('500');
  });

  it('formats percentages properly', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(97.6)).toBe('97,6%');
    expect(formatPercent(25.42)).toBe('25,4%');
  });

  it('calculates ring dash attributes', () => {
    const full = calculateRingDash(100);
    expect(full.gDash).toContain('238.8');
    expect(full.rDash).toContain('0 238.8');

    const empty = calculateRingDash(0);
    expect(empty.gDash).toContain('0 238.8');

    const split = calculateRingDash(50);
    expect(split.gDash).toContain('119.4');
    expect(split.rOff).toBe('-122.4');
  });

  it('calculates delta badges', () => {
    expect(calculateDeltaBadge(null)).toBeNull();
    const up = calculateDeltaBadge(12.5);
    expect(up?.isUp).toBe(true);
    expect(up?.text).toBe('▲ 12,5%');

    const down = calculateDeltaBadge(-84.6);
    expect(down?.isUp).toBe(false);
    expect(down?.text).toBe('▼ 84,6%');
  });

  it('calculates district breakdown', () => {
    const mockCompanies = [
      [1, 'Comp 1', '123', '01', 'G', 1, 1, 1000000, 0],
      [2, 'Comp 2', '456', '01', 'G', 1, 1, 500000, 0],
      [3, 'Comp 3', '789', '02', 'O', 0, 1, 2000000, 0],
      [4, 'Comp 4', '101', '03', 'R', 0, 1, 0, 0],
    ];
    const names = { '01': 'Samarqand sh.', '02': 'Oqdaryo t.', '03': 'Bulung‘ur t.' };
    const res = calculateDistrictsBreakdown(mockCompanies, names);

    expect(res.districts).toHaveLength(2); // Only districts with sales
    expect(res.districts[0].name).toBe('Oqdaryo t.');
    expect(res.districts[0].turnover).toBe(2000000);
    expect(res.districts[1].name).toBe('Samarqand sh.');
    expect(res.districts[1].count).toBe(2);
    expect(res.quietCount).toBe(1); // '03' has 0 sales
  });

  it('filters and paginates companies', () => {
    const mockCompanies = [
      [1, 'Farina Invest', '303190578', '01', 'G', 1, 1, 2040566499, -84.6],
      [2, 'Makon Mobile', '309121333', '01', 'G', 1, 1, 512439000, -97.5],
      [3, 'Aminjon XK', '300575194', '01', 'O', 1, 1, 479088600, -86.3],
      [4, 'Unconnected Firm', '999999999', '02', 'R', 0, 1, 0, null],
    ];

    // Filter by type 'G'
    const typeRes = filterAndPaginateCompanies(mockCompanies, { type: 'G' });
    expect(typeRes.total).toBe(2);

    // Filter by status 'off'
    const offRes = filterAndPaginateCompanies(mockCompanies, { status: 'off' });
    expect(offRes.total).toBe(1);
    expect(offRes.rows[0][1]).toBe('Unconnected Firm');

    // Filter by query
    const qRes = filterAndPaginateCompanies(mockCompanies, { query: '309121333' });
    expect(qRes.total).toBe(1);
    expect(qRes.rows[0][1]).toBe('Makon Mobile');

    // Filter by search alias
    const sRes = filterAndPaginateCompanies(mockCompanies, { search: 'Farina' });
    expect(sRes.total).toBe(1);
    expect(sRes.rows[0][1]).toBe('Farina Invest');
  });

  it('formats company rows with correct labels, indices, delta and status', () => {
    const mockCompanies = [
      [1, 'Farina Invest', '303190578', '01', 'G', 1, 1, 2040566499, -84.6],
      [2, 'Makon Mobile', '309121333', '01', 'O', 0, 1, 0, null],
    ];
    const paginated = filterAndPaginateCompanies(mockCompanies, { page: 0, pageSize: 10 });
    const districtNames = { '01': 'Samarqand shahri' };
    const typeNames = { G: 'Oziq-ovqat', O: 'Boshqalar' };

    const formatted = formatCompanyRows(paginated, districtNames, typeNames);
    expect(formatted).toHaveLength(2);

    expect(formatted[0]).toEqual({
      rowNumber: 1,
      id: 1,
      name: 'Farina Invest',
      tin: '303190578',
      district: 'Samarqand shahri',
      type: 'Oziq-ovqat',
      isConnected: true,
      turnover30d: 2040566499,
      deltaText: '▼ 84,6%',
      isDeltaUp: false,
    });

    expect(formatted[1]).toEqual({
      rowNumber: 2,
      id: 2,
      name: 'Makon Mobile',
      tin: '309121333',
      district: 'Samarqand shahri',
      type: 'Boshqalar',
      isConnected: false,
      turnover30d: 0,
      deltaText: '—',
      isDeltaUp: null,
    });
  });
});
