import { describe, it, expect } from 'vitest';
import {
  SAMARQAND_FULL_DISTRICTS,
  buildSamarqandDistricts,
  filterAndSortDistricts,
  buildSamarqandKpis,
} from './samarqandDistrictsAnalytics';

describe('samarqandDistrictsAnalytics', () => {
  it('contains 16 official districts and cities for Samarqand', () => {
    expect(SAMARQAND_FULL_DISTRICTS).toHaveLength(16);
    expect(SAMARQAND_FULL_DISTRICTS.map((d) => d.code)).toContain('01'); // Samarqand sh.
    expect(SAMARQAND_FULL_DISTRICTS.map((d) => d.code)).toContain('05'); // Ishtixon t.
    expect(SAMARQAND_FULL_DISTRICTS.map((d) => d.code)).toContain('04'); // Jomboy t.
  });

  it('aggregates companies correctly by district', () => {
    const districts = buildSamarqandDistricts();
    expect(districts).toHaveLength(16);

    const samSh = districts.find((d) => d.code === '01');
    expect(samSh.name).toBe('Samarqand shahri');
    expect(samSh.companies).toBe(36);
    expect(samSh.connected).toBe(13);
    expect(samSh.turnover).toBeGreaterThan(4_000_000_000);
    expect(samSh.hasCompanies).toBe(true);
    expect(samSh.link).toBe('/platform/analytics/viloyatlar/18?district=01');

    const ishtixon = districts.find((d) => d.code === '05');
    expect(ishtixon.name).toBe('Ishtixon tumani');
    expect(ishtixon.companies).toBe(2);
    expect(ishtixon.link).toBe('/platform/analytics/viloyatlar/18?district=05');

    const jomboy = districts.find((d) => d.code === '04');
    expect(jomboy.name).toBe('Jomboy tumani');
    expect(jomboy.companies).toBe(1);

    const qosh = districts.find((d) => d.code === '07');
    expect(qosh.name).toBe('Qo‘shrabot tumani');
    expect(qosh.companies).toBe(0);
    expect(qosh.hasCompanies).toBe(false);
  });

  it('filters active and empty districts correctly', () => {
    const districts = buildSamarqandDistricts();
    const active = filterAndSortDistricts(districts, 'active');
    const empty = filterAndSortDistricts(districts, 'empty');

    expect(active).toHaveLength(10);
    expect(empty).toHaveLength(6);
  });

  it('sorts districts by turnover, companies, and name', () => {
    const districts = buildSamarqandDistricts();

    const byTurnover = filterAndSortDistricts(districts, 'all', 'turnover');
    expect(byTurnover[0].code).toBe('01'); // Samarqand sh. has highest turnover

    const byCompanies = filterAndSortDistricts(districts, 'all', 'companies');
    expect(byCompanies[0].companies).toBeGreaterThanOrEqual(byCompanies[1].companies);

    const byName = filterAndSortDistricts(districts, 'all', 'name');
    expect(byName[0].name.localeCompare(byName[1].name, 'uz')).toBeLessThanOrEqual(0);
  });

  it('computes 4 KPI cards accurately', () => {
    const districts = buildSamarqandDistricts();
    const kpis = buildSamarqandKpis(districts, '30d');

    expect(kpis).toHaveLength(4);
    expect(kpis[0].label).toBe('Umumiy aylanma');
    expect(kpis[0].value).toContain('4,04 mlrd');
    expect(kpis[1].label).toBe('Jami korxonalar');
    expect(kpis[1].value).toBe('63');
    expect(kpis[2].label).toBe('Ulangan korxonalar');
    expect(kpis[2].value).toBe('16');
    expect(kpis[2].badgeText).toBe('25,4%');
  });

  it('integrates backend results rows and KPI when available', () => {
    const mockBackendRows = [
      {
        code: '15',
        nameUz: 'Urgut tumani',
        enterprises: 10,
        connected: 8,
        totalTurnover: 120000000,
        fiscalTurnover: 110000000,
        fiscalSharePct: 91.6,
        turnoverDeltaPct: 25.4,
      },
    ];

    const districts = buildSamarqandDistricts([], mockBackendRows);
    const urgut = districts.find((d) => d.code === '15');
    expect(urgut.companies).toBe(10);
    expect(urgut.connected).toBe(8);
    expect(urgut.turnover).toBe(120000000);
    expect(urgut.fiscalSharePct).toBe(91.6);
    expect(urgut.turnoverDeltaPct).toBe(25.4);

    const mockBackendKpi = {
      totalEnterprises: 100,
      connected: 75,
      connectedSharePct: 75,
      totalTurnover: 5000000000,
      totalTurnoverDeltaPct: 18.2,
      newConnections: 14,
      newConnectionsDeltaPct: 10.5,
    };

    const kpis = buildSamarqandKpis(districts, '30d', mockBackendKpi);
    expect(kpis[0].value).toContain('5,00 mlrd');
    expect(kpis[0].delta).toBe(18.2);
    expect(kpis[1].value).toBe('100');
    expect(kpis[2].value).toBe('75');
    expect(kpis[2].badgeText).toBe('75,0%');
    expect(kpis[3].value).toBe('14');
  });
});
