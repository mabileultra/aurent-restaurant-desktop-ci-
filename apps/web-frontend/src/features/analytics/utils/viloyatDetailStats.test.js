import { describe, it, expect } from 'vitest';
import {
  normalizeBackendCompany,
  normalizeCompaniesList,
  computeDistrictTurnover,
  computeBusinessTypeTabs,
  generateDailyBars,
  resolveDistrictMeta,
} from './viloyatDetailStats';

describe('viloyatDetailStats', () => {
  it('normalizes backend company object into uniform array', () => {
    const raw = {
      companyId: 101,
      name: 'Test Corp',
      tin: '123456789',
      districtCode: '05',
      businessType: 'F',
      connected: true,
      storeCount: 2,
      totalTurnover: 50000000,
      weekDeltaPct: 15.5,
      fiscalTurnover: 48000000,
    };

    const norm = normalizeBackendCompany(raw);
    expect(norm[0]).toBe(101);
    expect(norm[1]).toBe('Test Corp');
    expect(norm[2]).toBe('123456789');
    expect(norm[3]).toBe('05');
    expect(norm[4]).toBe('F');
    expect(norm[5]).toBe(1);
    expect(norm[7]).toBe(50000000);
    expect(norm[8]).toBe(15.5);
    expect(norm[9]).toBe(48000000);
  });

  it('keeps existing array as-is', () => {
    const arr = [1, 'Name', 'TIN', '01', 'F', 1, 1, 1000, 10, 950];
    expect(normalizeBackendCompany(arr)).toBe(arr);
  });

  it('normalizes list or falls back to default', () => {
    expect(normalizeCompaniesList([], ['fallback'])).toEqual(['fallback']);
    expect(normalizeCompaniesList(null, ['fallback'])).toEqual(['fallback']);

    const list = [{ companyId: 1, name: 'A' }];
    const res = normalizeCompaniesList(list, []);
    expect(res).toHaveLength(1);
    expect(res[0][0]).toBe(1);
  });

  it('computes district turnover correctly in district mode', () => {
    const companies = [
      [1, 'C1', 'T1', '05', 'F', 1, 1, 100000, null, 90000],
      [2, 'C2', 'T2', '05', 'F', 0, 1, 50000, null, 40000],
    ];

    const turnover = computeDistrictTurnover({
      companies,
      activeType: 'F',
      isDistrictView: true,
      baseTurnover: null,
    });

    expect(turnover.all).toBe(150000);
    expect(turnover.allF).toBe(130000);
    expect(turnover.allN).toBe(20000);
    expect(turnover.f30).toBeCloseTo(86.66, 1);
  });

  it('computes business type tabs with accurate counts', () => {
    const companies = [
      [1, 'C1', 'T1', '05', 'F', 1],
      [2, 'C2', 'T2', '05', 'R', 1],
      [3, 'C3', 'T3', '05', 'R', 0],
    ];

    const tabs = computeBusinessTypeTabs({ companies, isDistrictView: true });
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toEqual({ id: 'A', label: 'Hammasi', n: 3, c: 2 });
    expect(tabs[1]).toEqual({ id: 'F', label: 'Oziq-ovqat', n: 1, c: 1 });
    expect(tabs[2]).toEqual({ id: 'R', label: 'Restoranlar', n: 2, c: 1 });
  });

  it('generates daily bars with proportional scaling', () => {
    const baseDays = [100, 0, 50];
    const bars = generateDailyBars(baseDays, 0.5);
    expect(bars).toHaveLength(3);
    expect(bars[0].val).toBe(50);
    expect(bars[1].val).toBe(0);
    expect(bars[2].val).toBe(25);
  });

  it('resolves district meta string accurately', () => {
    const districtMeta = resolveDistrictMeta({
      isDistrictView: true,
      totalCount: 6,
      connectedCount: 2,
    });
    expect(districtMeta).toBe('6 korxona · 2 ulangan');

    const regionMeta = resolveDistrictMeta({
      isDistrictView: false,
      totalCount: 63,
      connectedCount: 16,
      totalDistricts: 16,
    });
    expect(regionMeta).toBe('63 korxona · 16 ulangan · 16 ta tuman va shahar');
  });
});
