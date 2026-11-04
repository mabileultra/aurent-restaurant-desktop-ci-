import { describe, expect, it } from 'vitest';
import { classifyPharmacyImportMatch, defaultImportMatchSelected } from './classifyPharmacyImportMatch';

describe('classifyPharmacyImportMatch', () => {
  it('marks tasnif hits green', () => {
    expect(classifyPharmacyImportMatch({
      ikpuStatus: 'FOUND',
      markedProduct: true,
      packageCode: '1546940',
    })).toBe('found');
  });

  it('marks found marked rows without pack yellow', () => {
    expect(classifyPharmacyImportMatch({
      ikpuStatus: 'FOUND',
      markedProduct: true,
      packageCode: '1',
    })).toBe('partial');
  });

  it('marks missing tasnif red and off by default', () => {
    const item = { ikpuStatus: 'MANUAL', ikpu: '123' };
    expect(classifyPharmacyImportMatch(item)).toBe('missing');
    expect(defaultImportMatchSelected(item)).toBe(false);
  });

  it('skips duplicate invoices', () => {
    expect(classifyPharmacyImportMatch({ status: 'DUPLICATE', ikpuStatus: 'FOUND' })).toBe('duplicate');
  });
});
