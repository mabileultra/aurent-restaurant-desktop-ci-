import { describe, it, expect, vi } from 'vitest';
import {
  fetchAllCompanies,
  aggregateRepublicDays,
  aggregateRepublicWeeks,
} from './analyticsCompanyLoader';
import { analyticsApi } from '../api/analyticsApi';

describe('analyticsCompanyLoader', () => {
  describe('aggregateRepublicDays', () => {
    it('returns empty array when input is empty or invalid', () => {
      expect(aggregateRepublicDays([])).toEqual([]);
      expect(aggregateRepublicDays(null)).toEqual([]);
    });

    it('aggregates daily turnover across multiple companies chronologically', () => {
      const companyDetails = [
        {
          name: 'Company A',
          days: [
            { date: '2026-11-02', fiscalTurnover: 100, nonFiscalTurnover: 20, totalTurnover: 120 },
            { date: '2026-11-03', fiscalTurnover: 200, nonFiscalTurnover: 0, totalTurnover: 200 },
          ],
        },
        {
          name: 'Company B',
          days: [
            { date: '2026-11-01', fiscalTurnover: 50, nonFiscalTurnover: 10, totalTurnover: 60 },
            { date: '2026-11-02', fiscalTurnover: 300, nonFiscalTurnover: 50, totalTurnover: 350 },
          ],
        },
      ];

      const res = aggregateRepublicDays(companyDetails);
      expect(res).toHaveLength(3);
      // Chronological order: 2026-11-01, 2026-11-02, 2026-11-03
      expect(res[0].date).toBe('2026-11-01');
      expect(res[0].totalTurnover).toBe(60);

      expect(res[1].date).toBe('2026-11-02');
      expect(res[1].fiscalTurnover).toBe(400); // 100 + 300
      expect(res[1].nonFiscalTurnover).toBe(70); // 20 + 50
      expect(res[1].totalTurnover).toBe(470);
      expect(res[1].topCompany).toBe('Company B'); // 350 > 120

      expect(res[2].date).toBe('2026-11-03');
      expect(res[2].totalTurnover).toBe(200);
      expect(res[2].topCompany).toBe('Company A');
    });
  });

  describe('aggregateRepublicWeeks', () => {
    it('returns empty array when input is empty', () => {
      expect(aggregateRepublicWeeks([])).toEqual([]);
    });

    it('aggregates weeks and computes fiscalSharePct', () => {
      const companyDetails = [
        {
          weeks: [
            { weekFrom: '2026-10-26', weekTo: '2026-11-01', fiscalTurnover: 80, nonFiscalTurnover: 20, totalTurnover: 100 },
          ],
        },
        {
          weeks: [
            { weekFrom: '2026-10-26', weekTo: '2026-11-01', fiscalTurnover: 120, nonFiscalTurnover: 80, totalTurnover: 200 },
          ],
        },
      ];

      const res = aggregateRepublicWeeks(companyDetails);
      expect(res).toHaveLength(1);
      expect(res[0].fiscalTurnover).toBe(200);
      expect(res[0].nonFiscalTurnover).toBe(100);
      expect(res[0].totalTurnover).toBe(300);
      expect(res[0].fiscalSharePct).toBeCloseTo(66.67, 1);
      expect(res[0].label).toBeTruthy();
    });
  });

  describe('fetchAllCompanies', () => {
    it('fetches all companies across pages when totalElements > 100', async () => {
      vi.spyOn(analyticsApi, 'getCompanies').mockImplementation(async (params) => {
        if (params.page === 0) {
          return {
            data: {
              totalElements: 114,
              rows: Array(100).fill({ companyId: 1, name: 'Firm' }),
            },
          };
        }
        return {
          data: {
            totalElements: 114,
            rows: Array(14).fill({ companyId: 2, name: 'Firm 2' }),
          },
        };
      });

      const res = await fetchAllCompanies({});
      expect(res.rows).toHaveLength(114);
      expect(res.totalElements).toBe(114);
      vi.restoreAllMocks();
    });
  });
});
