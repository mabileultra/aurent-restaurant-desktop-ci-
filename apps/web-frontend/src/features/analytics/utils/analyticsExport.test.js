import { describe, expect, it } from 'vitest';
import { buildCsvContent, buildExcelContent } from './analyticsExport';

describe('analyticsExport', () => {
  it('builds CSV with UTF-8 BOM and properly quoted cells', () => {
    const headers = ['Nomi', 'Aylanma', 'Ulush'];
    const rows = [
      ['Samarqand viloyati', '4,19 mlrd', '95,3%'],
      ['"Maxsus" MCHJ', '100 000', '10%'],
    ];

    const result = buildCsvContent(headers, rows);
    expect(result.startsWith('\uFEFF')).toBe(true);
    expect(result).toContain('"Samarqand viloyati","4,19 mlrd","95,3%"');
    expect(result).toContain('"""Maxsus"" MCHJ"');
  });

  it('handles empty or null values', () => {
    const headers = ['Col1', 'Col2'];
    const rows = [[null, undefined]];
    const result = buildCsvContent(headers, rows);
    expect(result).toContain('"",');
  });

  it('builds native Excel SpreadsheetML XML with typed cells', () => {
    const headers = ['Hudud', 'Aylanma'];
    const rows = [['Samarqand', 4150000000]];
    const result = buildExcelContent(headers, rows);
    expect(result).toContain('xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"');
    expect(result).toContain('<Data ss:Type="String">Hudud</Data>');
    expect(result).toContain('<Data ss:Type="Number">4150000000</Data>');
  });
});
