import { describe, expect, it } from 'vitest';
import {
  calculateAttentionItems,
  calculateDailyMetrics,
  calculateFiscalDistribution,
  calculateResultsTotals,
  calculateTop5Share,
} from './analyticsCalculations';

describe('analyticsCalculations', () => {
  const mockCompanies = [
    { companyId: 1, name: 'Firm A', connected: true, totalTurnover: 1000, fiscalTurnover: 900, nonFiscalTurnover: 100, regionCode: '1726' },
    { companyId: 2, name: 'Firm B', connected: false, totalTurnover: 500, fiscalTurnover: 0, nonFiscalTurnover: 500, regionCode: '1726' },
    { companyId: 3, name: 'Firm C', connected: true, totalTurnover: 0, fiscalTurnover: 0, nonFiscalTurnover: 0, regionCode: '1726' },
    { companyId: 4, name: 'Firm D', connected: false, totalTurnover: 200, fiscalTurnover: 0, nonFiscalTurnover: 200, regionCode: '' },
  ];

  it('calculates top 5 share correctly', () => {
    const res = calculateTop5Share(mockCompanies);
    expect(res.topAmount).toBe(1700);
    expect(res.sharePct).toBe(100);
    expect(res.topCompanies.length).toBe(4);
  });

  it('calculates fiscal distribution buckets', () => {
    const res = calculateFiscalDistribution(mockCompanies);
    expect(res.sellingCount).toBe(3);
    expect(res.zeroFiscalCount).toBe(2);
    expect(res.highFiscalCount).toBe(1);
    expect(res.buckets).toHaveLength(5);
  });

  it('calculates daily metrics with peak day', () => {
    const days = [
      { date: '2026-10-23', totalTurnover: 100 },
      { date: '2026-10-24', totalTurnover: 500 },
      { date: '2026-10-25', totalTurnover: 0 },
    ];
    const metrics = calculateDailyMetrics(days);
    expect(metrics.avgDaily).toBe(200);
    expect(metrics.activeDays).toBe(2);
    expect(metrics.totalDays).toBe(3);
    expect(metrics.peakDay).toEqual({ date: '2026-10-24', amount: 500 });
  });

  it('calculates attention items correctly', () => {
    const attention = calculateAttentionItems(mockCompanies);
    expect(attention.notConnectedSelling.count).toBe(2);
    expect(attention.connectedNoReceipts.count).toBe(1);
    expect(attention.missingRegion.count).toBe(1);
  });

  it('calculates results totals and percentages accurately', () => {
    const rows = [
      { fiscalTurnover: 4000, nonFiscalTurnover: 1000, totalTurnover: 5000 },
      { fiscalTurnover: 2000, nonFiscalTurnover: 3000, totalTurnover: 5000 },
    ];
    const totals = calculateResultsTotals(rows);
    expect(totals.fiscalTurnover).toBe(6000);
    expect(totals.nonFiscalTurnover).toBe(4000);
    expect(totals.totalTurnover).toBe(10000);
    expect(totals.fiscalPct).toBe(60);
    expect(totals.nonFiscalPct).toBe(40);
  });
});

